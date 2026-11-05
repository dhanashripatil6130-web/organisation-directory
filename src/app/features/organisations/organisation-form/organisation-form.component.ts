import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { isKnownStatus, KNOWN_STATUSES, KnownStatus, Organisation } from '../../../core/models/organisation.model';
import { ApiError } from '../../../core/services/organisation-api.service';
import { OrganisationService } from '../../../core/services/organisation.service';
import { isValidEmail } from '../../../core/utils/email';

const NAME_MIN = 3;
const NAME_MAX = 80;

interface Feedback {
  kind: 'success' | 'invalid' | 'error';
  name?: string;
}

const nameLength: ValidatorFn = (control) => {
  const length = String(control.value).trim().length;
  if (length === 0) {
    return { required: true };
  }
  if (length < NAME_MIN) {
    return { minlength: true };
  }
  return length > NAME_MAX ? { maxlength: true } : null;
};

const emailFormat: ValidatorFn = (control) =>
  control.value === '' || isValidEmail(String(control.value).trim()) ? null : { email: true };

@Component({
  selector: 'app-organisation-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organisation-form.component.html',
  styleUrl: './organisation-form.component.scss',
})
export class OrganisationFormComponent implements OnInit {
  private readonly service = inject(OrganisationService);

  readonly organisation = input<Organisation | null>(null);
  readonly closed = output<void>();
  readonly saved = output<Organisation>();

  protected readonly statuses = KNOWN_STATUSES;
  protected readonly errorParams = { min: NAME_MIN, max: NAME_MAX };
  protected readonly saving = signal(false);
  protected readonly feedback = signal<Feedback | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [
      '',
      {
        validators: [nameLength],
        asyncValidators: [(control: AbstractControl) => this.uniqueName(control)],
        updateOn: 'blur' as const,
      },
    ],
    status: ['' as KnownStatus | '', Validators.required],
    ownerEmail: ['', [Validators.required, emailFormat]],
    memberCount: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  ngOnInit(): void {
    const org = this.organisation();
    if (org) {
      this.form.setValue({
        name: org.name ?? '',
        status: isKnownStatus(org.status) ? org.status : '',
        ownerEmail: org.ownerEmail ?? '',
        memberCount: org.memberCount,
      });
      this.form.markAllAsTouched();
    }
  }

  protected errorKey(control: AbstractControl): string | null {
    if (!control.touched || !control.errors) {
      return null;
    }
    return `form.error.${Object.keys(control.errors)[0]}`;
  }

  protected async submit(): Promise<void> {
    this.feedback.set(null);

    const { name, status, ownerEmail, memberCount } = this.form.getRawValue();
    if (this.form.invalid || status === '') {
      this.form.markAllAsTouched();
      this.feedback.set({ kind: 'invalid' });
      return;
    }

    this.saving.set(true);
    try {
      const input = { name, status, ownerEmail, memberCount };
      const current = this.organisation();

      if (current) {
        this.saved.emit(await this.service.update(current, input));
      } else {
        const created = await this.service.create(input);
        this.form.reset();
        this.feedback.set({ kind: 'success', name: created.name ?? name });
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'duplicate') {
        this.form.controls.name.setErrors({ duplicate: true });
        this.form.controls.name.markAsTouched();
        this.feedback.set({ kind: 'invalid' });
      } else {
        this.feedback.set({ kind: 'error' });
      }
    } finally {
      this.saving.set(false);
    }
  }

  private uniqueName(control: AbstractControl): Observable<ValidationErrors | null> {
    const name = String(control.value).trim();
    if (name === '') {
      return of(null);
    }
    return this.service
      .isNameTaken(name, this.organisation()?.position ?? null)
      .pipe(map((taken) => (taken ? { duplicate: true } : null)));
  }
}

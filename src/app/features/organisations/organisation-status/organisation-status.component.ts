import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { OrganisationStatus } from '../../../core/models/organisation.model';

@Component({
  selector: 'app-organisation-status',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status" [class]="'status status--' + status() + ' status--' + variant()">
      <span class="status__dot" aria-hidden="true"></span>
      {{ 'status.' + status() | t }}
    </span>
  `,
  styleUrl: './organisation-status.component.scss',
})
export class OrganisationStatusComponent {
  readonly status = input.required<OrganisationStatus>();
  readonly variant = input<'pill' | 'plain'>('pill');
}

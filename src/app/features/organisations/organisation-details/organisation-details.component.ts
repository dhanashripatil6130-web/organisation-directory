import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Organisation } from '../../../core/models/organisation.model';
import { OrganisationAvatarComponent } from '../organisation-avatar/organisation-avatar.component';
import { OrganisationStatusComponent } from '../organisation-status/organisation-status.component';

@Component({
  selector: 'app-organisation-details',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslatePipe, OrganisationAvatarComponent, OrganisationStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organisation-details.component.html',
  styleUrl: './organisation-details.component.scss',
})
export class OrganisationDetailsComponent {
  readonly organisation = input.required<Organisation>();
  readonly edit = output<void>();
  readonly closed = output<void>();

  protected readonly issues = computed(() => {
    const org = this.organisation();
    const issues: string[] = [];

    if (!org.name) issues.push('details.issue.name');
    if (org.status === 'unknown') issues.push('details.issue.status');
    if (org.memberCount === null) issues.push('details.issue.members');
    if (!org.ownerEmail) issues.push('details.issue.owner');
    else if (!org.ownerEmailValid) issues.push('details.issue.email');
    if (org.createdAt === null) issues.push('details.issue.date');
    return issues;
  });
}

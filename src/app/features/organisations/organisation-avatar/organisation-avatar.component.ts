import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

const TONE_COUNT = 5;

@Component({
  selector: 'app-organisation-avatar',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="avatar" [class]="'avatar avatar--' + tone()" aria-hidden="true">{{
    initials() ?? ('table.avatarFallback' | t)
  }}</span>`,
  styleUrl: './organisation-avatar.component.scss',
})
export class OrganisationAvatarComponent {
  readonly name = input<string | null>(null);
  readonly seed = input.required<number>();

  protected readonly tone = computed(() => Math.abs(this.seed()) % TONE_COUNT);
  protected readonly initials = computed(() => {
    const words = this.name()?.split(/\s+/).filter(Boolean) ?? [];
    return words.length ? words.slice(0, 2).map((word) => Array.from(word)[0]).join('').toUpperCase() : null;
  });
}

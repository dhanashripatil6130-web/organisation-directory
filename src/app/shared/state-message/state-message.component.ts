import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-state-message',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './state-message.component.html',
  styleUrl: './state-message.component.scss',
})
export class StateMessageComponent {
  readonly kind = input.required<'loading' | 'empty' | 'error'>();
  readonly messageKey = input<string>();

  protected readonly message = computed(() => this.messageKey() ?? `state.${this.kind()}.message`);
  protected readonly role = computed(() => (this.kind() === 'error' ? 'alert' : 'status'));
}

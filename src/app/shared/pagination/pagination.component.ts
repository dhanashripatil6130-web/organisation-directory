import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { MAX_PAGE_SIZE } from '../../core/services/organisation-api.service';

export const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE];

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly sizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly pages = computed<(number | null)[]>(() => {
    const last = this.pageCount();
    const current = this.page();
    const shown = [...new Set([1, current - 1, current, current + 1, last])]
      .filter((page) => page >= 1 && page <= last)
      .sort((a, b) => a - b);

    const items: (number | null)[] = [];
    let previous = 0;
    for (const page of shown) {
      if (page - previous === 2) {
        items.push(previous + 1);
      } else if (page - previous > 2) {
        items.push(null);
      }
      items.push(page);
      previous = page;
    }
    return items;
  });
  protected readonly from = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
}

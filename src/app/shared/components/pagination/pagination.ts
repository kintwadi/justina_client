import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LocaleService } from '../../../core/services/locale.service';
import { IconComponent } from '../icon/icon';

/** Placeholder token rendered between distant page numbers. */
const ELLIPSIS = '…';
/** Page-window size below which every page number is rendered verbatim. */
const COMPACT_LIMIT = 7;

interface PageItem {
  label: string;
  /** Target page, or {@code null} for an ellipsis placeholder. */
  value: number | null;
  current: boolean;
  ariaLabel: string;
}

/**
 * Numbered pager with previous/next controls, shared by the storefront grid and the
 * admin tables. Stateless: the parent owns the current page and reacts to {@code pageChange}.
 */
@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class PaginationComponent {
  private readonly locale = inject(LocaleService);

  /** Current page, one-based. */
  readonly page = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSize = input(12);
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / Math.max(1, this.pageSize()))),
  );
  protected readonly items = computed(() => this.buildItems(this.page(), this.totalPages()));
  protected readonly canGoPrev = computed(() => this.page() > 1);
  protected readonly canGoNext = computed(() => this.page() < this.totalPages());
  protected readonly previousLabel = computed(() => this.locale.t('pagination.previous'));
  protected readonly nextLabel = computed(() => this.locale.t('pagination.next'));

  protected previous(): void {
    this.select(this.page() - 1);
  }

  protected next(): void {
    this.select(this.page() + 1);
  }

  protected select(target: number | null): void {
    if (target === null) {
      return;
    }
    const clamped = Math.min(Math.max(1, target), this.totalPages());
    if (clamped !== this.page()) {
      this.pageChange.emit(clamped);
    }
  }

  /** Builds a compact `1 … n-1 n n+1 … last` sequence, or every page when short. */
  private buildItems(current: number, total: number): PageItem[] {
    const values =
      total <= COMPACT_LIMIT
        ? Array.from({ length: total }, (_, index) => index + 1)
        : this.compactValues(current, total);

    return values.map((value) =>
      value === null
        ? { label: ELLIPSIS, value: null, current: false, ariaLabel: ELLIPSIS }
        : {
            label: String(value),
            value,
            current: value === current,
            ariaLabel: this.locale.t('pagination.page', { page: value }),
          },
    );
  }

  private compactValues(current: number, total: number): (number | null)[] {
    const anchors = new Set<number>([1, total, current, current - 1, current + 1]);
    const sorted = [...anchors].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

    const values: (number | null)[] = [];
    let previous = 0;
    for (const page of sorted) {
      if (previous !== 0 && page - previous > 1) {
        values.push(null);
      }
      values.push(page);
      previous = page;
    }
    return values;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslationKey } from '../../core/i18n/translations';
import { CategoryId } from '../../core/models/product.model';
import { CatalogService, SORT_OPTIONS, SortOption } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { LocaleService } from '../../core/services/locale.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid';

type CategoryFilter = string | 'all';

const PAGE_SIZE = 9;

const SORT_LABEL_KEYS: Record<SortOption, TranslationKey> = {
  featured: 'sort.featured',
  'price-low': 'sort.priceLow',
  'price-high': 'sort.priceHigh',
  newest: 'sort.newest',
  name: 'sort.name',
};

@Component({
  selector: 'app-shop-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, PaginationComponent, ProductGridComponent],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class ShopPageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly content = inject(ContentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly locale = inject(LocaleService);

  protected readonly categories = this.catalog.categories;

  protected readonly sortOptions = computed(() =>
    SORT_OPTIONS.map((option) => ({
      value: option.value,
      label: this.locale.t(SORT_LABEL_KEYS[option.value]),
    })),
  );
  protected readonly priceRanges = computed(() => this.activePriceRanges());

  protected readonly category = signal<CategoryFilter>('all');
  protected readonly search = signal('');
  protected readonly selectedRangeIndexes = signal<readonly number[]>([]);
  protected readonly onSaleOnly = signal(false);
  protected readonly newOnly = signal(false);
  protected readonly sort = signal<SortOption>('featured');

  protected readonly pageSize = PAGE_SIZE;
  protected readonly page = signal(1);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly results = computed(() =>
    this.catalog.query({
      category: this.category(),
      priceRanges: this.selectedRangeValues(),
      onSaleOnly: this.onSaleOnly(),
      newOnly: this.newOnly(),
      search: this.search(),
      sort: this.sort(),
    }),
  );

  protected readonly totalResults = computed(() => this.results().length);
  protected readonly pagedResults = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.results().slice(start, start + this.pageSize);
  });
  protected readonly showingText = computed(() => {
    const total = this.totalResults();
    const from = total === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
    const to = Math.min(from + this.pageSize - 1, total);
    return this.locale.t('shop.showingRange', { from, to, total });
  });

  private readonly selectedRangeValues = computed(() =>
    this.selectedRangeIndexes()
      .map((index) => this.priceRanges()[index]?.value)
      .filter((value): value is string => Boolean(value)),
  );

  private activePriceRanges(): Array<{ value: string; label: string }> {
    const currency = this.locale.currency();
    const configured = this.content.shopPriceRanges[currency];
    if (configured?.length) {
      return configured.map((range) => ({
        value: this.baseRangeValue(range.min, range.max),
        label: this.displayRangeLabel(range.min, range.max),
      }));
    }

    const baseRanges = this.content.shopPriceRanges['EUR'] ?? [];
    return baseRanges.map((range) => ({
      value: `${range.min}-${range.max}`,
      label: this.displayRangeLabel(
        this.fromBaseCurrency(range.min),
        this.fromBaseCurrency(range.max),
      ),
    }));
  }

  private baseRangeValue(min: number, max: number): string {
    return `${this.toBaseCurrency(min)}-${this.toBaseCurrency(max)}`;
  }

  private displayRangeLabel(min: number, max: number): string {
    if (min === 0) {
      return this.locale.t('shop.under', { value: this.formatCurrencyAmount(max) });
    }
    return `${this.formatCurrencyAmount(min)} — ${this.formatCurrencyAmount(max)}`;
  }

  private formatCurrencyAmount(value: number): string {
    const symbol = this.locale.activeCurrency()?.symbol ?? '€';
    return `${symbol}${this.round(value)}`;
  }

  private toBaseCurrency(value: number): number {
    const rate = this.locale.activeCurrency()?.rate ?? 1;
    return this.round(value / rate);
  }

  private fromBaseCurrency(value: number): number {
    const rate = this.locale.activeCurrency()?.rate ?? 1;
    return this.round(value * rate);
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const category = params.get('category') as CategoryFilter | null;
      this.category.set(category && category.trim() ? category : 'all');

      const search = params.get('search');
      if (search !== null) {
        this.search.set(search);
      }

      this.page.set(1);

      if (params.get('focus') === 'search') {
        setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
      }
    });
  }

  protected selectCategory(category: CategoryFilter): void {
    this.category.set(category);
    this.page.set(1);
    void this.router.navigate([], {
      queryParams: { category: category === 'all' ? null : category },
      queryParamsHandling: 'merge',
    });
  }

  protected updateSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected updateSort(value: SortOption): void {
    this.sort.set(value);
    this.page.set(1);
  }

  protected toggleOnSale(): void {
    this.onSaleOnly.update((value) => !value);
    this.page.set(1);
  }

  protected toggleNew(): void {
    this.newOnly.update((value) => !value);
    this.page.set(1);
  }

  protected toggleRange(index: number): void {
    this.selectedRangeIndexes.update((ranges) =>
      ranges.includes(index) ? ranges.filter((range) => range !== index) : [...ranges, index],
    );
    this.page.set(1);
  }

  protected isRangeSelected(index: number): boolean {
    return this.selectedRangeIndexes().includes(index);
  }

  protected clearSearch(): void {
    this.search.set('');
    this.page.set(1);
  }

  protected changePage(page: number): void {
    this.page.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

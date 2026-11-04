import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import { API_URL } from '../config/api.config';
import { CategoryTile, CollectionBlock } from '../models/content.model';
import { Category, CategoryId, Product } from '../models/product.model';
import { CATEGORY_TILES, COLLECTIONS } from '../data/mock-content';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../data/mock-products';

export type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'name';

export interface ProductQuery {
  category?: CategoryId | 'all';
  priceRanges?: readonly string[];
  onSaleOnly?: boolean;
  newOnly?: boolean;
  search?: string;
  sort?: SortOption;
}

export const SORT_OPTIONS: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Sort: Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name', label: 'Name: A to Z' },
];

/**
 * Catalogue data sourced from the Spring Boot REST API. The whole catalogue is fetched once on
 * bootstrap, then filtered client-side so the shop sidebar stays instant and reactive. Falls back
 * to the bundled mock catalogue when the API is unreachable.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  private readonly products = signal<Product[]>([]);
  private readonly categoryList = signal<Category[]>([]);
  private readonly collectionList = signal<CollectionBlock[]>([]);
  private readonly tileList = signal<CategoryTile[]>([]);

  readonly allProducts = this.products.asReadonly();
  readonly categories = this.categoryList.asReadonly();
  readonly collections = this.collectionList.asReadonly();
  readonly categoryTiles = this.tileList.asReadonly();

  readonly totalCount = computed(() => this.products().length);

  /** Loads every catalogue facet; never errors so app bootstrap can proceed offline. */
  load(): Observable<void> {
    return forkJoin({
      products: this.http
        .get<Product[]>(`${API_URL}/products`)
        .pipe(catchError(() => of([...MOCK_PRODUCTS]))),
      categories: this.http
        .get<Category[]>(`${API_URL}/categories`)
        .pipe(catchError(() => of([...MOCK_CATEGORIES]))),
      collections: this.http
        .get<CollectionBlock[]>(`${API_URL}/catalog/collections`)
        .pipe(catchError(() => of([...COLLECTIONS]))),
      tiles: this.http
        .get<CategoryTile[]>(`${API_URL}/catalog/category-tiles`)
        .pipe(catchError(() => of([...CATEGORY_TILES]))),
    }).pipe(
      tap(({ products, categories, collections, tiles }) => {
        this.products.set(products);
        this.categoryList.set(categories);
        this.collectionList.set(collections);
        this.tileList.set(tiles);
      }),
      map(() => undefined),
    );
  }

  featured(limit = 4): Product[] {
    return this.products().slice(0, limit);
  }

  findById(id: number): Product | undefined {
    return this.products().find((product) => product.id === id);
  }

  query(criteria: ProductQuery = {}): Product[] {
    const {
      category = 'all',
      priceRanges = [],
      onSaleOnly = false,
      newOnly = false,
      search = '',
      sort = 'featured',
    } = criteria;

    let result = [...this.products()];

    if (category !== 'all') {
      result = result.filter((product) => product.category === category);
    }

    if (priceRanges.length > 0) {
      result = result.filter((product) =>
        priceRanges.some((range) => {
          const [min, max] = range.split('-').map(Number);
          return product.price >= min && product.price <= max;
        }),
      );
    }

    if (onSaleOnly) {
      result = result.filter((product) => product.originalPrice !== null);
    }

    if (newOnly) {
      result = result.filter((product) => product.badge === 'New');
    }

    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter((product) =>
        [product.name, product.category, product.description].some((field) =>
          field.toLowerCase().includes(term),
        ),
      );
    }

    return this.sortProducts(result, sort);
  }

  /** Re-runs the initial fetch, used after admin mutations so the storefront reflects changes. */
  reload(): Observable<void> {
    return this.load();
  }

  private sortProducts(products: Product[], sort: SortOption): Product[] {
    switch (sort) {
      case 'price-low':
        return products.sort((a, b) => a.price - b.price);
      case 'price-high':
        return products.sort((a, b) => b.price - a.price);
      case 'newest':
        return products.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'name':
        return products.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return products;
    }
  }
}

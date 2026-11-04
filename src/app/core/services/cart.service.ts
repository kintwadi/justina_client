import { Injectable, computed, effect, signal } from '@angular/core';
import { CartLine } from '../models/cart.model';
import { Product } from '../models/product.model';

/** In-memory cart state used by the sidebar, quick view modal and header badge. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private static readonly STORAGE_KEY = 'atelier-cart';
  private readonly lines = signal<CartLine[]>([]);

  readonly items = this.lines.asReadonly();
  readonly count = computed(() =>
    this.lines().reduce((total, line) => total + line.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.lines().reduce((total, line) => total + line.product.price * line.quantity, 0),
  );
  readonly isEmpty = computed(() => this.lines().length === 0);

  constructor() {
    this.lines.set(this.readStoredLines());
    effect(() => {
      this.persist(this.lines());
    });
  }

  add(product: Product, quantity = 1): void {
    this.lines.update((lines) => {
      const existing = lines.find((line) => this.sameLine(line.product, product));
      if (existing) {
        return lines.map((line) =>
          this.sameLine(line.product, product)
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [...lines, { product, quantity }];
    });
  }

  increment(productId: number, delta: number, variantSku?: string | null): void {
    const line = this.lines().find(
      (item) =>
        item.product.id === productId &&
        (item.product.selectedVariantSku ?? null) === (variantSku ?? null),
    );
    if (!line) {
      return;
    }
    if (line.quantity + delta <= 0) {
      this.remove(productId, line.product.selectedVariantSku ?? null);
      return;
    }
    this.lines.update((lines) =>
      lines.map((item) =>
        item.product.id === productId &&
        (item.product.selectedVariantSku ?? null) === (line.product.selectedVariantSku ?? null)
          ? { ...item, quantity: item.quantity + delta }
          : item,
      ),
    );
  }

  remove(productId: number, variantSku?: string | null): void {
    this.lines.update((lines) =>
      lines.filter(
        (line) =>
          !(
            line.product.id === productId &&
            (line.product.selectedVariantSku ?? null) === (variantSku ?? null)
          ),
      ),
    );
  }

  private sameLine(left: Product, right: Product): boolean {
    return (
      left.id === right.id &&
      (left.selectedVariantSku ?? null) === (right.selectedVariantSku ?? null)
    );
  }

  private readStoredLines(): CartLine[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(CartService.STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((entry) => this.parseLine(entry))
        .filter((entry): entry is CartLine => Boolean(entry));
    } catch {
      return [];
    }
  }

  private persist(lines: CartLine[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(CartService.STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Ignore storage failures so the cart still works in memory.
    }
  }

  private parseLine(value: unknown): CartLine | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const candidate = value as { product?: unknown; quantity?: unknown };
    const product = this.parseProduct(candidate.product);
    const quantity =
      typeof candidate.quantity === 'number' && Number.isFinite(candidate.quantity)
        ? Math.max(1, Math.floor(candidate.quantity))
        : null;

    return product && quantity ? { product, quantity } : null;
  }

  private parseProduct(value: unknown): Product | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const candidate = value as Partial<Product>;
    if (
      typeof candidate.id !== 'number' ||
      typeof candidate.name !== 'string' ||
      typeof candidate.category !== 'string' ||
      typeof candidate.price !== 'number' ||
      typeof candidate.image !== 'string' ||
      typeof candidate.imageClass !== 'string' ||
      typeof candidate.description !== 'string' ||
      typeof candidate.inStock !== 'boolean' ||
      typeof candidate.date !== 'string'
    ) {
      return null;
    }

    return {
      id: candidate.id,
      name: candidate.name,
      category: candidate.category,
      productType: candidate.productType ?? null,
      sku: candidate.sku ?? null,
      price: candidate.price,
      originalPrice:
        typeof candidate.originalPrice === 'number' || candidate.originalPrice === null
          ? candidate.originalPrice
          : null,
      badge: typeof candidate.badge === 'string' || candidate.badge === null ? candidate.badge : null,
      image: candidate.image,
      gallery: Array.isArray(candidate.gallery)
        ? candidate.gallery.filter((item): item is string => typeof item === 'string')
        : [],
      options:
        candidate.options && typeof candidate.options === 'object' ? candidate.options : null,
      imageClass: candidate.imageClass,
      description: candidate.description,
      inStock: candidate.inStock,
      stockQuantity:
        typeof candidate.stockQuantity === 'number' ? candidate.stockQuantity : undefined,
      date: candidate.date,
      variants: Array.isArray(candidate.variants) ? candidate.variants : undefined,
      selectedVariantSku:
        typeof candidate.selectedVariantSku === 'string' || candidate.selectedVariantSku === null
          ? candidate.selectedVariantSku
          : null,
      selectedVariantName:
        typeof candidate.selectedVariantName === 'string' || candidate.selectedVariantName === null
          ? candidate.selectedVariantName
          : null,
    };
  }
}

export type CategoryId = string;

export const CATEGORY_IDS: CategoryId[] = ['bags', 'wallets', 'accessories'];

export interface ProductVariant {
  sku: string;
  name: string;
  price?: number | null;
  priceDelta: number | null;
  stock: number;
  image?: string | null;
  gallery?: string[];
  options?: Record<string, string> | null;
}

export interface Product {
  id: number;
  name: string;
  category: CategoryId;
  productType?: string | null;
  sku?: string | null;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  image: string;
  gallery?: string[];
  options?: Record<string, string> | null;
  /** Gradient used behind the image so the card still looks intentional while loading. */
  imageClass: string;
  description: string;
  inStock: boolean;
  stockQuantity?: number;
  date: string;
  customMade?: boolean;
  variants?: ProductVariant[];
  selectedVariantSku?: string | null;
  selectedVariantName?: string | null;
}

export interface Category {
  id: CategoryId | 'all';
  label: string;
  count: number;
}

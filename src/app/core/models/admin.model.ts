import { CategoryId } from './product.model';
import { UserRole } from './auth.model';

/** Localized overrides for a product's translatable fields, keyed by language code then field. */
export type ProductTranslations = Record<string, Record<string, string>>;

/** Full product shape returned by the admin catalogue endpoints. */
export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  category: CategoryId;
  productType?: string | null;
  sku: string | null;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  image: string;
  gallery: string[];
  options?: Record<string, string>;
  imageClass: string | null;
  description: string;
  inStock: boolean;
  stockQuantity: number;
  date: string | null;
  featured: boolean;
  customMade?: boolean;
  variants: ProductVariant[];
  translations?: ProductTranslations;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  name: string;
  price?: number | null;
  priceDelta: number | null;
  stock: number;
  image?: string | null;
  gallery?: string[];
  options?: Record<string, string>;
}

/** Payload accepted by `POST /api/products` and `PUT /api/products/{id}`. */
export interface AdminProductPayload {
  name: string;
  slug: string | null;
  category: string;
  productType?: string | null;
  sku: string | null;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  image: string;
  gallery: string[];
  options?: Record<string, string>;
  imageClass: string | null;
  description: string;
  inStock: boolean;
  stockQuantity: number;
  date: string | null;
  featured: boolean;
  customMade: boolean;
  displayOrder: number | null;
  variants: ProductVariant[];
  translations?: ProductTranslations;
}

/** Result of an upload to the Cloudflare R2 media endpoint. */
export interface MediaUpload {
  key: string;
  url: string;
  size: number;
  contentType: string;
  originalFilename: string;
}

export interface AdminCategory {
  id: number;
  slug: string;
  label: string;
  description: string | null;
  displayOrder: number;
  productCount: number;
}

export interface AdminCategoryPayload {
  slug: string | null;
  label: string;
  description: string | null;
  displayOrder: number | null;
}

export interface AdminProductType {
  id: number;
  slug: string;
  label: string;
  category: string | null;
  description: string | null;
  displayOrder: number;
  presetFields: string[];
}

export interface AdminProductTypePayload {
  slug: string | null;
  label: string;
  category: string | null;
  description: string | null;
  displayOrder: number | null;
  presetFields: string[];
}

/** Aggregate product counters returned by the admin summary endpoint. */
export interface ProductSummary {
  total: number;
  inStock: number;
  featured: number;
  onSale: number;
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

export interface AdminUserPayload {
  firstName: string;
  lastName: string | null;
  email: string;
  password: string;
  role: 'ADMIN' | 'OPERATOR';
  enabled: boolean;
}

export interface AdminUserUpdatePayload {
  firstName: string;
  lastName: string | null;
  role: 'ADMIN' | 'OPERATOR';
  enabled: boolean;
}

export interface AdminOrderItem {
  productId: number;
  productName: string;
  variantSku: string | null;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AdminOrder {
  id: number;
  orderNumber: string;
  customerEmail: string;
  status: 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'REQUIRES_ACTION' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  currency: string;
  subtotal: number;
  total: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminOrderUpdatePayload {
  status: AdminOrder['status'] | null;
  paymentStatus: AdminOrder['paymentStatus'] | null;
}

export type CustomOrderRequestType = 'PRODUCT' | 'DESIGN';
export type CustomOrderStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'QUOTED'
  | 'APPROVED'
  | 'DECLINED'
  | 'COMPLETED';

export interface CustomOrderRequestPayload {
  productId: number | null;
  title: string;
  quantity: number;
  preferredMaterial: string | null;
  preferredColor: string | null;
  sizeDetails: string | null;
  referenceImageUrl: string | null;
  budget: number | null;
  budgetCurrency: string | null;
  targetTimeline: string | null;
  notes: string;
}

export interface CustomOrderRequestRecord {
  id: number;
  requestNumber: string;
  type: CustomOrderRequestType;
  customerId: number;
  customerName: string;
  customerEmail: string;
  productId: number | null;
  productName: string | null;
  title: string;
  quantity: number;
  preferredMaterial: string | null;
  preferredColor: string | null;
  sizeDetails: string | null;
  referenceImageUrl: string | null;
  budget: number | null;
  budgetCurrency: string | null;
  targetTimeline: string | null;
  notes: string;
  status: CustomOrderStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CustomOrderUpdatePayload {
  status: CustomOrderStatus;
  adminNotes: string | null;
}

export interface AdminContentBlock<T = unknown> {
  key: string;
  locale?: string;
  section: string;
  displayOrder: number;
  payload: T;
}

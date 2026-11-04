export interface OrderItem {
  productId: number;
  productName: string;
  variantSku: string | null;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  total: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  items: OrderItem[];
}

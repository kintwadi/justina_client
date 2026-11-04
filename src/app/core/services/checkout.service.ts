import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import { CartLine } from '../models/cart.model';

export interface CartItemRequest {
  productId: number;
  quantity: number;
  variantSku?: string | null;
}

export interface CheckoutSession {
  orderId: number;
  orderNumber: string;
  sessionId: string;
  checkoutUrl: string;
  amountTotal: number;
  currency: string;
}

/** Stripe checkout session creation for the shopping bag. */
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);

  createSession(
    lines: readonly CartLine[],
    currency: string,
    language: string,
    customerEmail?: string,
    origin = window.location.origin,
  ): Observable<CheckoutSession> {
    const items: CartItemRequest[] = lines.map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
      variantSku: line.product.selectedVariantSku ?? null,
    }));

    return this.http.post<CheckoutSession>(`${API_URL}/payments/checkout-session`, {
      items,
      currency,
      locale: language,
      customerEmail: customerEmail ?? null,
      successUrl: `${origin}/shop?checkout=success`,
      cancelUrl: `${origin}/shop?checkout=cancel`,
    });
  }
}

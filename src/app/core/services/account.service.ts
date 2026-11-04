import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import { OrderSummary } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  myOrders(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${API_URL}/payments/my-orders`);
  }
}

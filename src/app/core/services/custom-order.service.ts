import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import { CustomOrderRequestPayload, CustomOrderRequestRecord } from '../models/admin.model';

/** Authenticated storefront service for submitting bespoke requests. */
@Injectable({ providedIn: 'root' })
export class CustomOrderService {
  private readonly http = inject(HttpClient);

  create(payload: CustomOrderRequestPayload): Observable<CustomOrderRequestRecord> {
    return this.http.post<CustomOrderRequestRecord>(`${API_URL}/custom-orders`, payload);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import { ApiMessage } from '../models/auth.model';

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

/** Contact form and newsletter submission backed by the integration endpoints. */
@Injectable({ providedIn: 'root' })
export class IntegrationService {
  private readonly http = inject(HttpClient);

  sendContact(payload: ContactPayload): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_URL}/contact`, payload);
  }

  subscribeToNewsletter(email: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_URL}/newsletter`, { email });
  }
}

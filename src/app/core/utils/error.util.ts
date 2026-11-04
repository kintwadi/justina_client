import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/auth.model';

/**
 * Extracts a human-readable message from the backend error envelope
 * (`{message, fieldErrors:[...]}`) with sensible fallbacks for network failures.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiError | null;
    if (body && typeof body === 'object') {
      if (body.fieldErrors?.length) {
        return body.fieldErrors.map((item) => `${item.field}: ${item.message}`).join(', ');
      }
      if (body.message) {
        return body.message;
      }
    }
    if (error.status === 0) {
      return 'Unable to reach the server. Please try again.';
    }
  }
  return fallback;
}

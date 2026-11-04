import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';
import { LocaleService } from '../services/locale.service';

/**
 * Forwards the storefront's selected language to the backend as an `Accept-Language` header so the
 * API can resolve localized content blocks, product/category data and error messages.
 *
 * <p>The admin panel always operates on the base (English) data set — its editors read and write the
 * same fields — so requests made from an {@code /admin} route are left unlocalized.</p>
 */
export const localeInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  if (!request.url.startsWith(API_BASE_URL) || router.url.startsWith('/admin')) {
    return next(request);
  }

  const language = inject(LocaleService).language();
  return next(request.clone({ setHeaders: { 'Accept-Language': language } }));
};

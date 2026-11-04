import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import {
  AdminCategory,
  AdminCategoryPayload,
  AdminContentBlock,
  AdminOrder,
  AdminOrderUpdatePayload,
  AdminProduct,
  AdminProductPayload,
  AdminProductType,
  AdminProductTypePayload,
  AdminUser,
  AdminUserPayload,
  AdminUserUpdatePayload,
  CustomOrderRequestRecord,
  CustomOrderUpdatePayload,
  MediaUpload,
  ProductSummary,
} from '../models/admin.model';
import { PageResponse } from '../models/pagination.model';

/** Admin-only catalogue and media operations (all endpoints require the ADMIN role). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  /** Paged product list for the admin dashboard (`page` is zero-based). */
  listProductsPage(page: number, size: number): Observable<PageResponse<AdminProduct>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<AdminProduct>>(`${API_URL}/admin/catalog/products`, { params });
  }

  /** Aggregate product counters powering the dashboard stat cards. */
  productSummary(): Observable<ProductSummary> {
    return this.http.get<ProductSummary>(`${API_URL}/admin/catalog/products/summary`);
  }

  getProduct(id: number): Observable<AdminProduct> {
    return this.http.get<AdminProduct>(`${API_URL}/products/${id}`);
  }

  createProduct(payload: AdminProductPayload): Observable<AdminProduct> {
    return this.http.post<AdminProduct>(`${API_URL}/products`, payload);
  }

  updateProduct(id: number, payload: AdminProductPayload): Observable<AdminProduct> {
    return this.http.put<AdminProduct>(`${API_URL}/products/${id}`, payload);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/products/${id}`);
  }

  uploadMedia(file: File, folder?: string): Observable<MediaUpload> {
    const form = new FormData();
    form.append('file', file);
    let params = new HttpParams();
    if (folder) {
      params = params.set('folder', folder);
    }
    return this.http.post<MediaUpload>(`${API_URL}/media`, form, { params });
  }

  listCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(`${API_URL}/admin/catalog/categories`);
  }

  createCategory(payload: AdminCategoryPayload): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(`${API_URL}/admin/catalog/categories`, payload);
  }

  listProductTypes(): Observable<AdminProductType[]> {
    return this.http.get<AdminProductType[]>(`${API_URL}/admin/catalog/product-types`);
  }

  createProductType(payload: AdminProductTypePayload): Observable<AdminProductType> {
    return this.http.post<AdminProductType>(`${API_URL}/admin/catalog/product-types`, payload);
  }

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${API_URL}/admin/users`);
  }

  createUser(payload: AdminUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${API_URL}/admin/users`, payload);
  }

  updateUser(id: number, payload: AdminUserUpdatePayload): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${API_URL}/admin/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/admin/users/${id}`);
  }

  listOrders(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>(`${API_URL}/payments/admin/orders`);
  }

  updateOrder(orderNumber: string, payload: AdminOrderUpdatePayload): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${API_URL}/payments/admin/orders/${orderNumber}`, payload);
  }

  listCustomOrders(): Observable<CustomOrderRequestRecord[]> {
    return this.http.get<CustomOrderRequestRecord[]>(`${API_URL}/custom-orders/admin`);
  }

  updateCustomOrder(
    id: number,
    payload: CustomOrderUpdatePayload,
  ): Observable<CustomOrderRequestRecord> {
    return this.http.patch<CustomOrderRequestRecord>(`${API_URL}/custom-orders/admin/${id}`, payload);
  }

  siteContent(lang?: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${API_URL}/content`, { params: langParam(lang) });
  }

  getContentBlock<T>(key: string, lang?: string): Observable<AdminContentBlock<T>> {
    return this.http.get<AdminContentBlock<T>>(`${API_URL}/content/${key}`, {
      params: langParam(lang),
    });
  }

  upsertContentBlock<T>(key: string, payload: T, lang?: string): Observable<AdminContentBlock<T>> {
    return this.http.put<AdminContentBlock<T>>(`${API_URL}/content/${key}`, payload, {
      params: langParam(lang),
    });
  }
}

/** Builds the optional `?lang=` override honoured by the backend locale resolver. */
function langParam(lang: string | undefined): HttpParams {
  return lang ? new HttpParams().set('lang', lang) : new HttpParams();
}

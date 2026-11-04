/** Pagination envelope returned by paged REST endpoints (mirrors the backend `PageResponse`). */
export interface PageResponse<T> {
  content: T[];
  /** Zero-based page index. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

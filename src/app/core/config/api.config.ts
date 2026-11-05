/** 
 * Location of the Spring Boot REST API. 
 * Reads from the injected environment or falls back to localhost.
 */
export const API_BASE_URL = 
  (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env ? (globalThis as any).process.env['API_BASE_URL'] : null) ||
  (window as any).process?.env?.['API_BASE_URL'] || 
  'http://localhost:8080';

/** Root of the versioned API surface consumed by every data service. */
export const API_URL = `${API_BASE_URL}/api`;

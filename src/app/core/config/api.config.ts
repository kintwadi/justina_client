/**
 * Location of the Spring Boot REST API. Change this value (or the deployment environment) when
 * the backend is not served from the default local port.
 
export const API_BASE_URL = 'http://localhost:8080';

export const API_URL = `${API_BASE_URL}/api`;
*/

/** 
 * Location of the Spring Boot REST API. 
 * Reads from the .env file (via process.env) and falls back to localhost if not defined.
 */
export const API_BASE_URL = process.env['API_BASE_URL '] || 'http://localhost:8080';

/** Root of the versioned API surface consumed by every data service. */
export const API_URL = `${API_BASE_URL}/api`;



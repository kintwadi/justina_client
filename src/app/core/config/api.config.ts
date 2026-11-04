type RuntimeAppConfig = {
  API_BASE_URL?: string;
};

const runtimeConfig = (globalThis as typeof globalThis & {
  __APP_CONFIG__?: RuntimeAppConfig;
}).__APP_CONFIG__;

/**
 * Location of the Spring Boot REST API. In Docker/Render this is provided by a small runtime
 * config file generated from the container environment; local development falls back to localhost.
 */
export const API_BASE_URL =
  runtimeConfig?.API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8080';

/** Root of the versioned API surface consumed by every data service. */
export const API_URL = `${API_BASE_URL}/api`;

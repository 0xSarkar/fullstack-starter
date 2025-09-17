// Auto-generated thin client wrapper. Do not edit manually.
import createClientOrig from 'openapi-fetch';
import type { paths } from './schema';

export type { paths } from './schema';

export type UnauthorizedHandler = () => void;

export type CreateClientOptions = {
  baseUrl?: string;
  /** default: true, include cookies for auth */
  includeCredentials?: boolean;
  /** request timeout in ms, default: 10000 */
  timeoutMs?: number;
  /** called when a response is 401 */
  onUnauthorized?: UnauthorizedHandler;
  /** default headers */
  headers?: HeadersInit;
};

export const createClient = (opts: CreateClientOptions = {}) => {
  const baseUrl = opts.baseUrl || (typeof window !== 'undefined' ? (window as any).VITE_API_BASE_URL || '' : '');
  const includeCredentials = opts.includeCredentials ?? true;
  const timeoutMs = opts.timeoutMs ?? 10000;
  const onUnauthorized = opts.onUnauthorized;
  const defaultHeaders = opts.headers;

  const fetchWithConfig: typeof fetch = async (input, init) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Conditionally set Content-Type only for methods that typically send a body
      const headers = { ...defaultHeaders, ...(init?.headers as any) };
      const method = init?.method?.toUpperCase();
      if (method && ['POST', 'PUT', 'PATCH'].includes(method) && init?.body != null) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(input, {
        ...init,
        credentials: includeCredentials ? 'include' : init?.credentials,
        headers,
        signal: init?.signal ?? controller.signal,
      });
      if (res.status === 401 && onUnauthorized) {
        // fire async to not block consumer
        setTimeout(() => onUnauthorized(), 0);
      }
      return res;
    } finally {
      clearTimeout(id);
    }
  };

  const client = createClientOrig<paths>({ baseUrl, fetch: fetchWithConfig });
  return client;
};

export default createClient;

import { type ErrorResponse } from '@fullstack-starter/shared-schemas';

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, code?: string, details?: unknown, message?: string) {
    super(message || 'HTTP Error');
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<TResponse>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | null | undefined>,
  ): Promise<TResponse> {
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      url += `?${params.toString()}`;
    }

    const headers: Record<string, string> = {};

    const hasBody = body !== undefined;

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      credentials: 'include', // Include cookies for auth
    });

    const responseJson = await response.json();

    if (!response.ok) {
      const error = responseJson as ErrorResponse;
      throw new HttpError(response.status, error.code, error.details, error.error);
    }

    return responseJson as TResponse;
  }

  get<TResponse>(
    path: string,
    query?: Record<string, string | number | boolean | null | undefined>,
  ): Promise<TResponse> {
    return this.request<TResponse>('GET', path, undefined, query);
  }

  post<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return this.request<TResponse>('POST', path, body);
  }

  put<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return this.request<TResponse>('PUT', path, body);
  }

  patch<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return this.request<TResponse>('PATCH', path, body);
  }

  delete<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>('DELETE', path);
  }
}

// Singleton HTTP client instance
export const http = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

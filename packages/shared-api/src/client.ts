import { ErrorResponse, SuccessResponse } from '@fullstack-starter/shared-schemas';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(method: string, path: string, body?: any, query?: Record<string, any>): Promise<T> {
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Include cookies for auth
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      throw new Error(error.error || 'Request failed');
    }

    return data as T;
  }

  get<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', path, undefined, query);
  }

  post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

// Default client instance - apps can configure it
export const defaultClient = new ApiClient('');

// Export for apps to create their own
export { ApiClient as createClient };
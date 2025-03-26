import { JobsAPI } from './jobs.js';

export class CircleCIClient {
  protected baseURL = 'https://circleci.com/api/v2';
  protected headers: HeadersInit;
  public jobs: JobsAPI;

  constructor(token: string) {
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    this.jobs = new JobsAPI(token);
  }

  /**
   * Helper method to handle API responses
   */
  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status >= 400 && response.status < 600) {
        throw new Error(
          `CircleCI API Error: ${response.status} - ${errorData.message || response.statusText}`,
        );
      }
      throw new Error('No response received from CircleCI API');
    }
    return response.json() as Promise<T>;
  }

  /**
   * Helper method to make GET requests
   */
  protected async get<T>(path: string, params?: Record<string, any>) {
    const url = new URL(`${this.baseURL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Helper method to make POST requests
   */
  protected async post<T>(path: string, data?: Record<string, any>) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Helper method to make DELETE requests
   */
  protected async delete<T>(path: string) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Helper method to make PUT requests
   */
  protected async put<T>(path: string, data?: Record<string, any>) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PUT',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Helper method to make PATCH requests
   */
  protected async patch<T>(path: string, data?: Record<string, any>) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PATCH',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

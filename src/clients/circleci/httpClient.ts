export class HTTPClient {
  protected baseURL: string;
  protected headers: HeadersInit;

  constructor(baseURL: string, headers?: HeadersInit) {
    this.baseURL = baseURL;
    if (headers) {
      this.headers = headers;
    } else {
      this.headers = {};
    }
  }

  /**
   * Helper method to build URL with query parameters
   */
  protected buildURL(path: string, params?: Record<string, any>): URL {
    const url = new URL(`${this.baseURL}${path}`);
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v) => {
              url.searchParams.append(key, String(v));
            });
          } else if (typeof value === 'object') {
            url.searchParams.append(key, JSON.stringify(value));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }
    return url;
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
  async get<T>(path: string, params?: Record<string, any>) {
    const url = this.buildURL(path, params);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Helper method to make POST requests
   */
  async post<T>(
    path: string,
    data?: Record<string, any>,
    params?: Record<string, any>,
  ) {
    const url = this.buildURL(path, params);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Helper method to make DELETE requests
   */
  async delete<T>(path: string, params?: Record<string, any>) {
    const url = this.buildURL(path, params);
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: this.headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Helper method to make PUT requests
   */
  async put<T>(
    path: string,
    data?: Record<string, any>,
    params?: Record<string, any>,
  ) {
    const url = this.buildURL(path, params);
    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Helper method to make PATCH requests
   */
  async patch<T>(
    path: string,
    data?: Record<string, any>,
    params?: Record<string, any>,
  ) {
    const url = this.buildURL(path, params);
    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

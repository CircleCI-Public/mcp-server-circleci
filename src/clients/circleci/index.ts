import axios, { AxiosInstance } from 'axios';
import { JobsAPI } from './jobs.js';

export class CircleCIClient {
  protected client: AxiosInstance;
  protected baseURL = 'https://circleci.com/api/v2';
  public jobs: JobsAPI;

  constructor(token: string) {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Circle-Token': token,
        'Content-Type': 'application/json',
      },
    });

    this.jobs = new JobsAPI(token);

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          throw new Error(
            `CircleCI API Error: ${error.response.status} - ${error.response.data.message}`,
          );
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response received from CircleCI API');
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error(`Error setting up request: ${error.message}`);
        }
      },
    );
  }

  /**
   * Helper method to make GET requests
   */
  protected async get<T>(
    path: string,
    params?: Record<string, any>,
  ): Promise<T> {
    const response = await this.client.get<T>(path, { params });
    return response.data;
  }

  /**
   * Helper method to make POST requests
   */
  protected async post<T>(
    path: string,
    data?: Record<string, any>,
  ): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  /**
   * Helper method to make DELETE requests
   */
  protected async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete<T>(path);
    return response.data;
  }

  /**
   * Helper method to make PUT requests
   */
  protected async put<T>(path: string, data?: Record<string, any>): Promise<T> {
    const response = await this.client.put<T>(path, data);
    return response.data;
  }

  /**
   * Helper method to make PATCH requests
   */
  protected async patch<T>(
    path: string,
    data?: Record<string, any>,
  ): Promise<T> {
    const response = await this.client.patch<T>(path, data);
    return response.data;
  }
}

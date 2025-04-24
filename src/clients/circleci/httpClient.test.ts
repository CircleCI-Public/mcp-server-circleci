import { HTTPClient } from './httpClient.js';
import { expect, vi, describe, it, beforeEach, afterEach } from 'vitest';

describe('HTTPClient', () => {
  let client: HTTPClient;
  const apiPath = '/api/v2';
  const headers = { 'Content-Type': 'application/json' };
  const defaultBaseURL = 'https://circleci.com';
  const baseURL = defaultBaseURL + apiPath;

  beforeEach(() => {
    // Clear any environment variables before each test
    delete process.env.CIRCLECI_BASE_URL;
    client = new HTTPClient(defaultBaseURL, apiPath, { headers });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Clean up environment variables
    delete process.env.CIRCLECI_BASE_URL;
  });

  describe('constructor', () => {
    it('should use default base URL when CIRCLECI_BASE_URL is not set', () => {
      const url = (client as any).buildURL('/test');
      expect(url.toString()).toBe(`${defaultBaseURL}${apiPath}/test`);
    });

    it('should use CIRCLECI_BASE_URL when set', () => {
      const customBaseURL = 'https://custom-circleci.example.com';
      process.env.CIRCLECI_BASE_URL = customBaseURL;
      const customClient = new HTTPClient(customBaseURL, apiPath, { headers });
      const url = (customClient as any).buildURL('/test');
      expect(url.toString()).toBe(`${customBaseURL}${apiPath}/test`);
    });
  });

  describe('buildURL', () => {
    it('should build URL without params', () => {
      const path = '/test';
      const url = (client as any).buildURL(path);
      expect(url.toString()).toBe(`${baseURL}${path}`);
    });

    it('should build URL with simple params', () => {
      const path = '/test';
      const params = { key: 'value' };
      const url = (client as any).buildURL(path, params);
      expect(url.toString()).toBe(`${baseURL}${path}?key=value`);
    });

    it('should handle array params', () => {
      const path = '/test';
      const params = { arr: ['value1', 'value2'] };
      const url = (client as any).buildURL(path, params);
      expect(url.toString()).toBe(`${baseURL}${path}?arr=value1&arr=value2`);
    });
  });

  describe('handleResponse', () => {
    it('should handle successful response', async () => {
      const mockData = { success: true };
      const response = new Response(JSON.stringify(mockData), { status: 200 });
      const result = await (client as any).handleResponse(response);
      expect(result).toEqual(mockData);
    });

    it('should handle error response', async () => {
      const errorMessage = 'Not Found';
      const response = new Response(JSON.stringify({ message: errorMessage }), {
        status: 404,
      });
      await expect((client as any).handleResponse(response)).rejects.toThrow(
        'CircleCI API Error',
      );
    });
  });
});

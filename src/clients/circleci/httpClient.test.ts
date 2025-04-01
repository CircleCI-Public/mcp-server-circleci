import { HTTPClient } from './httpClient.js';
import { expect, vi, describe, it, beforeEach, afterEach } from 'vitest';

describe('HTTPClient', () => {
  let client: HTTPClient;
  const baseURL = 'https://api.example.com';
  const headers = { 'Content-Type': 'application/json' };

  beforeEach(() => {
    client = new HTTPClient(baseURL, headers);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
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

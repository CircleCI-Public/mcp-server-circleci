import { describe, it, expect } from 'vitest';
import {
  DeployComponentsResponse,
  DeployEnvironmentResponse,
} from '../schemas.js';

describe('DeployEnvironmentResponseSchema', () => {
  it('should parse a valid environment response with object labels', () => {
    const input = {
      items: [
        {
          id: 'env-1',
          name: 'production',
          description: 'Production environment',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          labels: [{ key: 'env', value: 'prod' }],
        },
      ],
      next_page_token: null,
    };

    const result = DeployEnvironmentResponse.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].labels).toEqual([{ key: 'env', value: 'prod' }]);
      expect(result.data.items[0].description).toBe('Production environment');
    }
  });

  it('should parse an environment with empty labels array', () => {
    const input = {
      items: [
        {
          id: 'env-1',
          name: 'staging',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          labels: [],
        },
      ],
      next_page_token: null,
    };

    const result = DeployEnvironmentResponse.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should parse an environment response without optional description', () => {
    const input = {
      items: [
        {
          id: 'env-1',
          name: 'staging',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          labels: [],
        },
      ],
      next_page_token: null,
    };

    const result = DeployEnvironmentResponse.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].description).toBeUndefined();
    }
  });

  it('should fail to parse if labels is an array of strings (old format)', () => {
    const input = {
      items: [
        {
          id: 'env-1',
          name: 'production',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          labels: ['env:prod'],
        },
      ],
      next_page_token: null,
    };

    const result = DeployEnvironmentResponse.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('DeployComponentsResponseSchema', () => {
  it('should parse a valid components response with object labels', () => {
    const input = {
      items: [
        {
          id: 'comp-1',
          project_id: 'project-1',
          name: 'frontend',
          release_count: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          labels: [{ key: 'tier', value: 'web' }],
        },
      ],
      next_page_token: null,
    };

    const result = DeployComponentsResponse.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].labels).toEqual([{ key: 'tier', value: 'web' }]);
    }
  });

  it('should parse a component with empty labels array', () => {
    const input = {
      items: [
        {
          id: 'comp-1',
          project_id: 'project-1',
          name: 'backend',
          release_count: 3,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          labels: [],
        },
      ],
      next_page_token: null,
    };

    const result = DeployComponentsResponse.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should parse a component with multiple labels', () => {
    const input = {
      items: [
        {
          id: 'comp-1',
          project_id: 'project-1',
          name: 'api',
          release_count: 10,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          labels: [
            { key: 'tier', value: 'api' },
            { key: 'team', value: 'platform' },
          ],
        },
      ],
      next_page_token: null,
    };

    const result = DeployComponentsResponse.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].labels).toHaveLength(2);
    }
  });

  it('should fail to parse if labels is an array of strings (old format)', () => {
    const input = {
      items: [
        {
          id: 'comp-1',
          project_id: 'project-1',
          name: 'frontend',
          release_count: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          labels: ['tier:web'],
        },
      ],
      next_page_token: null,
    };

    const result = DeployComponentsResponse.safeParse(input);
    expect(result.success).toBe(false);
  });
});

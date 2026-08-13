import { describe, it, expect } from 'vitest';
import {
  DeployComponentsResponse,
  DeployEnvironmentResponse,
  PaginatedArtifactResponse,
  PaginatedPipelineResponseSchema,
  PaginatedTestResponse,
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

describe('paginated response schemas: next_page_token', () => {
  // The API omits next_page_token entirely on the last page of some endpoints.
  // A required-but-nullable field rejects that with
  //   { code: 'invalid_type', expected: 'string', received: 'undefined',
  //     path: ['next_page_token'], message: 'Required' }
  // which surfaced as get_build_failure_logs failing before it sent a request.
  const schemas = {
    PaginatedPipelineResponseSchema,
    PaginatedArtifactResponse,
    PaginatedTestResponse,
  };

  for (const [name, schema] of Object.entries(schemas)) {
    describe(name, () => {
      it('parses a response with next_page_token absent', () => {
        const result = schema.safeParse({ items: [] });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.next_page_token).toBeUndefined();
        }
      });

      it('parses a response with next_page_token null', () => {
        const result = schema.safeParse({ items: [], next_page_token: null });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.next_page_token).toBeNull();
        }
      });

      it('parses a response with next_page_token set', () => {
        const result = schema.safeParse({
          items: [],
          next_page_token: 'token-1',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.next_page_token).toBe('token-1');
        }
      });

      it('rejects a non-string next_page_token', () => {
        const result = schema.safeParse({ items: [], next_page_token: 7 });
        expect(result.success).toBe(false);
      });
    });
  }
});

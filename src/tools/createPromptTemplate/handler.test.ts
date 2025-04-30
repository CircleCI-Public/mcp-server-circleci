import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPromptTemplate } from './handler.js';
import { CircletClient } from '../../clients/circlet/index.js';
import { recommendPromptTemplateTestsTool } from '../recommendPromptTemplateTests/tool.js';

// Mock dependencies
vi.mock('../../clients/circlet/index.js');

describe('createPromptTemplate handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return a valid MCP response with template and context schema', async () => {
    const mockCreatePromptTemplate = vi.fn().mockResolvedValue({
      template: 'This is a test template with {{variable}}',
      contextSchema: {
        variable: 'Description of the variable',
      },
    });

    const mockCircletInstance = {
      circlet: {
        createPromptTemplate: mockCreatePromptTemplate,
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const args = {
      params: {
        prompt: 'Create a test prompt template',
      },
    };

    const controller = new AbortController();
    const response = await createPromptTemplate(args, {
      signal: controller.signal,
    });

    expect(mockCreatePromptTemplate).toHaveBeenCalledWith(
      'Create a test prompt template',
    );

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');

    expect(response.content[0].text).toContain(
      'promptTemplate: This is a test template with {{variable}}',
    );
    expect(response.content[0].text).toContain('contextSchema: {');
    expect(response.content[0].text).toContain(
      '"variable": "Description of the variable"',
    );
    expect(response.content[0].text).toContain(`NEXT STEP:`);
    expect(response.content[0].text).toContain(
      `${recommendPromptTemplateTestsTool.name}`,
    );
  });

  it('should handle errors from CircletClient', async () => {
    const mockCircletInstance = {
      circlet: {
        createPromptTemplate: vi.fn().mockRejectedValue(new Error('API error')),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const args = {
      params: {
        prompt: 'Create a test prompt template',
      },
    };

    const controller = new AbortController();

    await expect(
      createPromptTemplate(args, { signal: controller.signal }),
    ).rejects.toThrow('API error');
  });
});

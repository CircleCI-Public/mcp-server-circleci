import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recommendPromptTemplateTests } from './handler.js';
import { CircletClient } from '../../clients/circlet/index.js';

// Mock dependencies
vi.mock('../../clients/circlet/index.js');

describe('recommendPromptTemplateTests handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return a valid MCP response with recommended tests', async () => {
    const mockRecommendedTests = [
      'Test with variable = "value1"',
      'Test with variable = "value2"',
      'Test with empty variable',
    ];

    const mockRecommendPromptTemplateTests = vi
      .fn()
      .mockResolvedValue(mockRecommendedTests);

    const mockCircletInstance = {
      circlet: {
        recommendPromptTemplateTests: mockRecommendPromptTemplateTests,
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const template = 'This is a test template with {{variable}}';
    const contextSchema = {
      variable: 'Description of the variable',
    };

    const args = {
      params: {
        template,
        contextSchema,
      },
    };

    const controller = new AbortController();
    const response = await recommendPromptTemplateTests(args, {
      signal: controller.signal,
    });

    expect(mockRecommendPromptTemplateTests).toHaveBeenCalledWith({
      template,
      contextSchema,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');

    const responseText = response.content[0].text;
    expect(responseText).toContain('recommendedTests:');
    expect(responseText).toContain(
      JSON.stringify(mockRecommendedTests, null, 2),
    );
    expect(responseText).toContain('NEXT STEP:');
    expect(responseText).toContain(
      'save the `promptTemplate`, `contextSchema`, and `recommendedTests`',
    );
    expect(responseText).toContain('RULES FOR SAVING FILES:');
    expect(responseText).toContain('./prompts');
  });

  it('should handle errors from CircletClient', async () => {
    const mockCircletInstance = {
      circlet: {
        recommendPromptTemplateTests: vi
          .fn()
          .mockRejectedValue(new Error('API error')),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const args = {
      params: {
        template: 'Test template',
        contextSchema: { variable: 'description' },
      },
    };

    const controller = new AbortController();

    await expect(
      recommendPromptTemplateTests(args, { signal: controller.signal }),
    ).rejects.toThrow('API error');
  });
});

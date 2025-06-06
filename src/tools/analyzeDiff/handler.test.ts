import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeDiff } from './handler.js';
import { CircletClient } from '../../clients/circlet/index.js';
import { RuleReview } from '../../clients/schemas.js';

// Mock the CircletClient
vi.mock('../../clients/circlet/index.js');

describe('analyzeDiff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return no rules message when rules is an empty string', async () => {
    const mockCircletInstance = {
      circlet: {
        ruleReview: vi.fn(),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const mockArgs = {
      params: {
        diff: 'diff --git a/test.ts b/test.ts\n+console.log("test");',
        rules: '',
      },
    };

    const controller = new AbortController();
    const result = await analyzeDiff(mockArgs, { signal: controller.signal });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No rules found. Please add rules to your repository.',
        },
      ],
    });
  });

  it('should return no diff message when diff is an empty string', async () => {
    const mockCircletInstance = {
      circlet: {
        ruleReview: vi.fn(),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const mockArgs = {
      params: {
        diff: '',
        rules: '',
      },
    };

    const controller = new AbortController();
    const result = await analyzeDiff(mockArgs, { signal: controller.signal });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No diff found. Please provide a diff to analyze.',
        },
      ],
    });
  });

  it('should handle complex diff content with multiple rules', async () => {
    const mockRuleReview: RuleReview = {
      isRuleCompliant: true,
      relatedRules: {
        compliant: [
          {
            rule: 'Rule 1: No console.log statements',
            reason: 'No console.log statements found',
            confidence_score: 0.95,
          },
        ],
        violations: [],
        requiresHumanReview: [],
      },
      unrelatedRules: [],
    };

    const mockCircletInstance = {
      circlet: {
        ruleReview: vi.fn().mockResolvedValue(mockRuleReview),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const mockArgs = {
      params: {
        diff: `diff --git a/src/component.ts b/src/component.ts
index 1234567..abcdefg 100644
--- a/src/component.ts
+++ b/src/component.ts
@@ -1,5 +1,8 @@
 export class Component {
+  private data: any = {};
+  
   constructor() {
+    console.log("Component created");
   }
 }`,
        rules: `Rule 1: No console.log statements
Rule 2: Avoid using 'any' type
Rule 3: Use proper TypeScript types
---
Rule 4: All functions must have JSDoc comments`,
      },
    };

    const controller = new AbortController();
    const result = await analyzeDiff(mockArgs, { signal: controller.signal });

    expect(mockCircletInstance.circlet.ruleReview).toHaveBeenCalledWith({
      diff: mockArgs.params.diff,
      rules: mockArgs.params.rules,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'All rules are compliant.',
        },
      ],
    });
  });

  it('should handle multiline rules and preserve formatting', async () => {
    const mockRuleReview: RuleReview = {
      isRuleCompliant: false,
      relatedRules: {
        compliant: [],
        violations: [
          {
            rule: 'No Console Logs',
            reason: 'Console.log statements found in code',
            confidence_score: 0.98,
            violation_instances: [
              {
                line_numbers_in_diff: ['2'],
                violating_code_snippet: 'console.log(x);',
                explanation_of_violation: 'Direct console.log usage',
              },
            ],
          },
        ],
        requiresHumanReview: [],
      },
      unrelatedRules: [],
    };

    const mockCircletInstance = {
      circlet: {
        ruleReview: vi.fn().mockResolvedValue(mockRuleReview),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const mockArgs = {
      params: {
        diff: '+const x = 5;\n+console.log(x);',
        rules: `# Cursor Rules Example

## Rule: No Console Logs
Description: Remove all console.log statements before committing code.

## Rule: TypeScript Safety
Description: Avoid using 'any' type.`,
      },
    };

    const controller = new AbortController();
    const result = await analyzeDiff(mockArgs, { signal: controller.signal });

    expect(mockCircletInstance.circlet.ruleReview).toHaveBeenCalledWith({
      diff: mockArgs.params.diff,
      rules: mockArgs.params.rules,
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Rule: No Console Logs');
    expect(result.content[0].text).toContain(
      'Reason: Console.log statements found in code',
    );
    expect(result.content[0].text).toContain('Confidence Score: 0.98');
  });

  it('should return compliant message when all rules are followed', async () => {
    const mockRuleReview: RuleReview = {
      isRuleCompliant: true,
      relatedRules: {
        compliant: [
          {
            rule: 'No console.log statements',
            reason: 'Code follows proper logging practices',
            confidence_score: 0.95,
          },
        ],
        violations: [],
        requiresHumanReview: [],
      },
      unrelatedRules: [],
    };

    const mockCircletInstance = {
      circlet: {
        ruleReview: vi.fn().mockResolvedValue(mockRuleReview),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const mockArgs = {
      params: {
        diff: 'diff --git a/test.ts b/test.ts\n+const logger = new Logger();',
        rules: 'Rule 1: No console.log statements\nRule 2: Use proper logging',
      },
    };

    const controller = new AbortController();
    const result = await analyzeDiff(mockArgs, { signal: controller.signal });

    expect(mockCircletInstance.circlet.ruleReview).toHaveBeenCalledWith({
      diff: mockArgs.params.diff,
      rules: mockArgs.params.rules,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'All rules are compliant.',
        },
      ],
    });
  });

  it('should return formatted violations when rules are violated', async () => {
    const mockRuleReview: RuleReview = {
      isRuleCompliant: false,
      relatedRules: {
        compliant: [],
        violations: [
          {
            rule: 'No console.log statements',
            reason: 'Console.log statements found in the code',
            confidence_score: 0.98,
            violation_instances: [
              {
                line_numbers_in_diff: ['5'],
                violating_code_snippet: 'console.log("test");',
                explanation_of_violation: 'Direct console.log usage',
              },
            ],
          },
          {
            rule: 'Avoid using any type',
            reason: 'Any type usage reduces type safety',
            confidence_score: 0.92,
            violation_instances: [
              {
                line_numbers_in_diff: ['3'],
                violating_code_snippet: 'private data: any = {};',
                explanation_of_violation: 'Variable declared with any type',
              },
            ],
          },
        ],
        requiresHumanReview: [],
      },
      unrelatedRules: [],
    };

    const mockCircletInstance = {
      circlet: {
        ruleReview: vi.fn().mockResolvedValue(mockRuleReview),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const mockArgs = {
      params: {
        diff: `diff --git a/src/component.ts b/src/component.ts
index 1234567..abcdefg 100644
--- a/src/component.ts
+++ b/src/component.ts
@@ -1,5 +1,8 @@
 export class Component {
+  private data: any = {};
+  
   constructor() {
+    console.log("Component created");
   }
 }`,
        rules: `Rule 1: No console.log statements
Rule 2: Avoid using 'any' type
Rule 3: Use proper TypeScript types`,
      },
    };

    const controller = new AbortController();
    const result = await analyzeDiff(mockArgs, { signal: controller.signal });

    expect(mockCircletInstance.circlet.ruleReview).toHaveBeenCalledWith({
      diff: mockArgs.params.diff,
      rules: mockArgs.params.rules,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Rule: No console.log statements
Reason: Console.log statements found in the code
Confidence Score: 0.98

Rule: Avoid using any type
Reason: Any type usage reduces type safety
Confidence Score: 0.92`,
        },
      ],
    });
  });

  it('should handle single violation correctly', async () => {
    const mockRuleReview: RuleReview = {
      isRuleCompliant: false,
      relatedRules: {
        compliant: [],
        violations: [
          {
            rule: 'No magic numbers',
            reason: 'Magic numbers make code less maintainable',
            confidence_score: 0.85,
            violation_instances: [
              {
                line_numbers_in_diff: ['2'],
                violating_code_snippet: 'const timeout = 5000;',
                explanation_of_violation: 'Hardcoded timeout value',
              },
            ],
          },
        ],
        requiresHumanReview: [],
      },
      unrelatedRules: [],
    };

    const mockCircletInstance = {
      circlet: {
        ruleReview: vi.fn().mockResolvedValue(mockRuleReview),
      },
    };

    vi.mocked(CircletClient).mockImplementation(
      () => mockCircletInstance as any,
    );

    const mockArgs = {
      params: {
        diff: '+const timeout = 5000;',
        rules: 'Rule: No magic numbers',
      },
    };

    const controller = new AbortController();
    const result = await analyzeDiff(mockArgs, { signal: controller.signal });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Rule: No magic numbers
Reason: Magic numbers make code less maintainable
Confidence Score: 0.85`,
        },
      ],
    });
  });
});

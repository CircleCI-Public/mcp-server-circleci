import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { analyzeDiffInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';

/**
 * Analyzes a git diff against cursor rules to identify rule violations
 * @param args - Tool arguments containing diff content and rules
 * @returns Analysis result with any rule violations found
 */
export const analyzeDiff: ToolCallback<{
  params: typeof analyzeDiffInputSchema;
}> = async (args) => {
  const { diff, rules } = args.params;
  const circlet = new CircletClient();
  if (!diff) {
    return {
      content: [
        {
          type: 'text',
          text: 'No diff found. Please provide a diff to analyze.',
        },
      ],
    };
  }

  if (!rules) {
    return {
      content: [
        {
          type: 'text',
          text: 'No rules found. Please add rules to your repository.',
        },
      ],
    };
  }

  const response = await circlet.circlet.ruleReview({
    diff,
    rules,
  });

  if (!response.isRuleCompliant) {
    return {
      content: [
        {
          type: 'text',
          text: response.relatedRules.violations
            .map((violation) => {
              return `Rule: ${violation.rule}\nReason: ${violation.reason}\nConfidence Score: ${violation.confidenceScore}`;
            })
            .join('\n\n'),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `All rules are compliant.`,
      },
    ],
  };
};

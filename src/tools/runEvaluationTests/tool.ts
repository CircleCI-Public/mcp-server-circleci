import { runEvaluationTestsInputSchema } from './inputSchema.js';

export const runEvaluationTestsTool = {
  name: 'run_evaluation_tests' as const,
  description: `
  This tool allows the users to run evaluation tests on a circleci pipeline.
  They can be referred to as "Prompt Tests" or "Evaluation Tests".

  About this tool:
  - This tool is part of a tool chain that runs evaluation tests on a circleci pipeline.
  - The tool will generate the appropriate circleci configuration file and trigger a pipeline using this temporary configuration.
  - The tool will return the project slug.

  Parameters:
  - params: An object containing:
    - template: string - The prompt template to be tested
    - projectSlug: string - The project slug obtained from listFollowedProjects tool (e.g., "gh/organization/project")
    - tests: Array of objects - The array of tests to run on the project
    - sampleInputs: Array of objects - The array of sample inputs for the prompt template

  Example usage:
  {
    "params": {
      "template": "The user wants a bedtime story about {{topic}} for a person of age {{age}} years old. Please craft a captivating tale that captivates their imagination and provides a delightful bedtime experience.",
      "projectSlug": "gh/organization/project",
      "tests": [
        {
          "name": "Test 1",
          "description": "Description of test 1"
        }
      ],
      "sampleInputs": [
        {
          "topic": "unicorns",
          "age": "6"
        }
      ]
    }
  }

  Returns:
  - the project slug
  `,
  inputSchema: runEvaluationTestsInputSchema,
};

#!/usr/bin/env node
/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get tool name from command line arguments
const toolName = process.argv[2];

if (!toolName) {
  console.error('Please provide a tool name');
  console.error('Example: node scripts/create-tool.js myNewTool');
  process.exit(1);
}

// Convert toolName to snake_case for tool name and camelCase for variables
const snakeCaseName = toolName
  .replace(/([a-z])([A-Z])/g, '$1_$2')
  .toLowerCase();

const camelCaseName = snakeCaseName.replace(/_([a-z])/g, (_, letter) =>
  letter.toUpperCase(),
);

// Create directory for the tool
const toolDir = path.join(
  path.resolve(__dirname, '..'),
  'src',
  'tools',
  toolName,
);

if (fs.existsSync(toolDir)) {
  console.error(`Tool directory already exists: ${toolDir}`);
  process.exit(1);
}

fs.mkdirSync(toolDir, { recursive: true });

// Create inputSchema.ts
const inputSchemaContent = `import { z } from 'zod';

export const ${camelCaseName}InputSchema = z.object({
  message: z
    .string()
    .describe(
      'A message to echo back to the user.',
    ),
});
`;

// Create tool.ts
const toolContent = `import { ${camelCaseName}InputSchema } from './inputSchema.js';

export const ${camelCaseName}Tool = {
  name: '${snakeCaseName}' as const,
  description: \`
  This tool is a basic "hello world" tool that echoes back a message provided by the user.

  Parameters:
  - params: An object containing:
    - message: string - A message provided by the user that will be echoed back.

  Example usage:
  {
    "params": {
      "message": "Hello, world!"
    }
  }

  Returns:
  - The message provided by the user.
  \`,
  inputSchema: ${camelCaseName}InputSchema,
};
`;

// Create handler.ts
const handlerContent = `import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ${camelCaseName}InputSchema } from './inputSchema.js';

export const ${camelCaseName}: ToolCallback<{
  params: typeof ${camelCaseName}InputSchema;
}> = async (args) => {
  const { message } = args.params;

  return {
    content: [
      {
        type: 'text',
        text: \`Received message: \${message}\`,
      },
    ],
  };
};
`;

// Create handler.test.ts
const testContent = `import { describe, it, expect } from 'vitest';
import { ${camelCaseName} } from './handler.js';

describe('${camelCaseName}', () => {
  it('should return the message provided by the user', async () => {
    const controller = new AbortController();
    const result = await ${camelCaseName}(
      {
        params: {
          message: 'Hello, world!',
        },
      },
      {
        signal: controller.signal,
      }
    );

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Received message: Hello, world!',
        },
      ],
    });
  });
});
`;

// Write files
fs.writeFileSync(path.join(toolDir, 'inputSchema.ts'), inputSchemaContent);
fs.writeFileSync(path.join(toolDir, 'tool.ts'), toolContent);
fs.writeFileSync(path.join(toolDir, 'handler.ts'), handlerContent);
fs.writeFileSync(path.join(toolDir, 'handler.test.ts'), testContent);

console.log(`
✅ Tool created successfully!

📂 Location: ${toolDir}

The following files were created:
- inputSchema.ts - Defines the input schema for the tool
- tool.ts - Defines the tool itself, including its name, description, and schema
- handler.ts - Contains the main logic for the tool
- handler.test.ts - Contains unit tests for the tool

Next steps:
1. Implement your tool's logic in handler.ts
2. Add the tool to src/circleci-tools.ts with these steps:
   a. Import your tool:
      import { ${camelCaseName}Tool } from './tools/${toolName}/tool.js';
      import { ${camelCaseName} } from './tools/${toolName}/handler.js';
   b. Add your tool to the CCI_TOOLS array:
      export const CCI_TOOLS = [
        ...,
        ${camelCaseName}Tool,
      ];
   c. Add your handler to the CCI_HANDLERS object:
      export const CCI_HANDLERS = {
        ...,
        ${snakeCaseName}: ${camelCaseName},
      } satisfies ToolHandlers;
3. Write appropriate tests in handler.test.ts
`);

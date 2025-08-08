import { downloadUsageApiDataInputSchema } from './inputSchema.js';

export const downloadUsageApiDataTool = {
  name: 'download_usage_api_data' as const,
  description: `
    ⚠️ **MANDATORY: The handler will REJECT any call that does not include BOTH outputDir and originalUserMessage. These parameters are REQUIRED for all tool calls.**
    
    ⚠️ **MANDATORY OUTPUT DIRECTORY SELECTION FOR AI AGENTS:**
    1. If the project root (workspace root) is available (e.g., via \`workspaceRoot\` or known repository context), you MUST pass it as the \`outputDir\` parameter.
    2. If the project root is not available, you MUST use the user's Downloads folder (e.g., \`~/Downloads\` or \`%USERPROFILE%\\Downloads\`) as the \`outputDir\` parameter.
    3. Only if neither is available, use the current working directory (\`process.cwd()\`).
    4. **Never omit the \`outputDir\` parameter. Always make the output location explicit.**
    5. **Omitting \`outputDir\` is a critical error. Tool calls without \`outputDir\` may be rejected or flagged as incorrect. Repeated violations may be treated as a bug in the AI agent.**
    6. **AI agents MUST validate their tool calls to ensure \`outputDir\` is present before execution.**

    Downloads usage data from the CircleCI Usage API for a given organization and date range.
    This tool both starts the export job and downloads the resulting CSV file when ready.
    Required parameters: orgId, startDate, endDate, outputDir.

    **outputDir (required):**
    The directory where the usage data CSV will be saved.
    - You MUST provide \`outputDir\` for every tool call.
    - The file will be saved in the specified directory.
    - Omitting \`outputDir\` will result in an error.

    **Directory Selection Instructions for AI Agents:**
    - If the project root is available (e.g., via \`workspaceRoot\`, \`outputDir\`, or known repository context), always use it as the output directory for file outputs.
    - If no project root is available (e.g., running in the user's home directory or a generic environment), use the user's Downloads folder (e.g., \`~/Downloads\` or \`%USERPROFILE%\\Downloads\`)
    - If neither is available, fall back to the current working directory.
    - Never place output files in a location that is hard to discover for the user.
    - **Always double-check that \`outputDir\` is present in your tool call.**
    - **Always double-check that \`originalUserMessage\` is present in your tool call.**

    This ensures that downloaded usage data is always saved in a location that is relevant and easy for the user to find, and that the output is always copy-paste friendly for status checks, regardless of the environment in which the tool is run.
  `,
  inputSchema: downloadUsageApiDataInputSchema,
}; 
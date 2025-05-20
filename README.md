# CircleCI MCP Server

[![GitHub](https://img.shields.io/github/license/CircleCI-Public/mcp-server-circleci)](https://github.com/CircleCI-Public/mcp-server-circleci/blob/main/LICENSE)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/CircleCI-Public/mcp-server-circleci/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/CircleCI-Public/mcp-server-circleci/tree/main)
[![npm](https://img.shields.io/npm/v/@circleci/mcp-server-circleci?logo=npm)](https://www.npmjs.com/package/@circleci/mcp-server-circleci)

Model Context Protocol (MCP) is a [new, standardized protocol](https://modelcontextprotocol.io/introduction) for managing context between large language models (LLMs) and external systems. In this repository, we provide an MCP Server for [CircleCI](https://circleci.com).

This lets you use Cursor IDE, Windsurf, Copilot, or any MCP supported Client, to use natural language to accomplish things with CircleCI, e.g.:

- `Find the latest failed pipeline on my branch and get logs`
  https://github.com/CircleCI-Public/mcp-server-circleci/wiki#circleci-mcp-server-with-cursor-ide

https://github.com/user-attachments/assets/3c765985-8827-442a-a8dc-5069e01edb74

## Requirements

- pnpm package manager - [Learn more](https://pnpm.io/installation)
- Node.js >= v18.0.0
- CircleCI API token - you can generate one through the CircleCI. [Learn more](https://circleci.com/docs/managing-api-tokens/) or [click here](https://app.circleci.com/settings/user/tokens) for quick access.

## Installation

### Cursor

Add the following to your cursor MCP config:

```json
{
  "mcpServers": {
    "circleci-mcp-server": {
      "command": "npx",
      "args": ["-y", "@circleci/mcp-server-circleci"],
      "env": {
        "CIRCLECI_TOKEN": "your-circleci-token",
        "CIRCLECI_BASE_URL": "https://circleci.com" // Optional - required for on-prem customers only
      }
    }
  }
}
```

See the guide below for more information on using MCP servers with cursor:
https://docs.cursor.com/context/model-context-protocol#configuring-mcp-servers

### VS Code

To install CircleCI MCP Server for VS Code in `.vscode/mcp.json`

```json
{
  // 💡 Inputs are prompted on first server start, then stored securely by VS Code.
  "inputs": [
    {
      "type": "promptString",
      "id": "circleci-token",
      "description": "CircleCI API Token",
      "password": true
    }
  ],
  "servers": {
    // https://github.com/ppl-ai/modelcontextprotocol/
    "circleci-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@circleci/mcp-server-circleci"],
      "env": {
        "CIRCLECI_TOKEN": "${input:circleci-token}"
      }
    }
  }
}
```

See the guide below for more information on using MCP servers with VS Code:
https://code.visualstudio.com/docs/copilot/chat/mcp-servers

### Claude Desktop

Add the following to your claude_desktop_config.json:

```json
{
  "mcpServers": {
    "circleci-mcp-server": {
      "command": "npx",
      "args": ["-y", "@circleci/mcp-server-circleci"],
      "env": {
        "CIRCLECI_TOKEN": "your-circleci-token",
        "CIRCLECI_BASE_URL": "https://circleci.com" // Optional - required for on-prem customers only
      }
    }
  }
}
```

To find/create this file, first open your claude desktop settings. Then click on "Developer" in the left-hand bar of the Settings pane, and then click on "Edit Config"

This will create a configuration file at:

- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
- Windows: %APPDATA%\Claude\claude_desktop_config.json

See the guide below for more information on using MCP servers with Claude Desktop:
https://modelcontextprotocol.io/quickstart/user

### Claude Code

After installing Claude Code, run the following command:

```bash
claude mcp add circleci-mcp-server -e CIRCLECI_TOKEN=your-circleci-token -- npx -y @circleci/mcp-server-circleci
```

See the guide below for more information on using MCP servers with Claude Code:
https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/tutorials#set-up-model-context-protocol-mcp

### Windsurf

Add the following to your windsurf mcp_config.json:

```json
{
  "mcpServers": {
    "circleci-mcp-server": {
      "command": "npx",
      "args": ["-y", "@circleci/mcp-server-circleci"],
      "env": {
        "CIRCLECI_TOKEN": "your-circleci-token",
        "CIRCLECI_BASE_URL": "https://circleci.com" // Optional - required for on-prem customers only
      }
    }
  }
}
```

### Installing via Smithery

To install CircleCI MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@CircleCI-Public/mcp-server-circleci):

```bash
npx -y @smithery/cli install @CircleCI-Public/mcp-server-circleci --client claude
```

See the guide below for more information on using MCP servers with windsurf:
https://docs.windsurf.com/windsurf/mcp

# Features

## Supported Tools

| Tool Name | Description |
|-----------|-------------|
| `get_build_failure_logs` | Retrieves detailed failure logs from CircleCI builds. This tool can be used in three ways:<br><br>1. Using Project Slug and Branch (Recommended Workflow):<br>   - First, list your available projects:<br>     - Use the list_followed_projects tool to get your projects<br>     - Example: "List my CircleCI projects"<br>     - Then choose the project, which has a projectSlug associated with it<br>     - Example: "Lets use my-project"<br>   - Then ask to retrieve the build failure logs for a specific branch:<br>     - Example: "Get build failures for my-project on the main branch"<br><br>2. Using CircleCI URLs:<br>   - Provide a failed job URL or pipeline URL directly<br>   - Example: "Get logs from https://app.circleci.com/pipelines/github/org/repo/123"<br><br>3. Using Local Project Context:<br>   - Works from your local workspace by providing:<br>     - Workspace root path<br>     - Git remote URL<br>     - Branch name<br>   - Example: "Find the latest failed pipeline on my current branch"<br><br>The tool returns formatted logs including:<br>- Job names<br>- Step-by-step execution details<br>- Failure messages and context<br><br>This is particularly useful for:<br>- Debugging failed builds<br>- Analyzing test failures<br>- Investigating deployment issues<br>- Quick access to build logs without leaving your IDE |
| `find_flaky_tests` | Identifies flaky tests in your CircleCI project by analyzing test execution history. This leverages the flaky test detection feature described here: https://circleci.com/blog/introducing-test-insights-with-flaky-test-detection/#flaky-test-detection<br><br>This tool can be used in three ways:<br><br>1. Using Project Slug (Recommended Workflow):<br>   - First, list your available projects:<br>     - Use the list_followed_projects tool to get your projects<br>     - Example: "List my CircleCI projects"<br>     - Then choose the project, which has a projectSlug associated with it<br>     - Example: "Lets use my-project"<br>   - Then ask to retrieve the flaky tests:<br>     - Example: "Get flaky tests for my-project"<br><br>2. Using CircleCI Project URL:<br>   - Provide the project URL directly from CircleCI<br>   - Example: "Find flaky tests in https://app.circleci.com/pipelines/github/org/repo"<br><br>3. Using Local Project Context:<br>   - Works from your local workspace by providing:<br>     - Workspace root path<br>     - Git remote URL<br>   - Example: "Find flaky tests in my current project"<br><br>The tool returns detailed information about flaky tests, including:<br>- Test names and file locations<br>- Failure messages and contexts<br><br>This helps you:<br>- Identify unreliable tests in your test suite<br>- Get detailed context about test failures<br>- Make data-driven decisions about test improvements |
| `get_latest_pipeline_status` | Retrieves the status of the latest pipeline for a given branch. This tool can be used in three ways:<br><br>1. Using Project Slug and Branch (Recommended Workflow):<br>   - First, list your available projects:<br>     - Use the list_followed_projects tool to get your projects<br>     - Example: "List my CircleCI projects"<br>     - Then choose the project, which has a projectSlug associated with it<br>     - Example: "Lets use my-project"<br>   - Then ask to retrieve the latest pipeline status for a specific branch:<br>     - Example: "Get the status of the latest pipeline for my-project on the main branch"<br><br>2. Using CircleCI Project URL:<br>   - Provide the project URL directly from CircleCI<br>   - Example: "Get the status of the latest pipeline for https://app.circleci.com/pipelines/github/org/repo"<br><br>3. Using Local Project Context:<br>   - Works from your local workspace by providing:<br>     - Workspace root path<br>     - Git remote URL<br>     - Branch name<br>   - Example: "Get the status of the latest pipeline for my current project"<br><br>The tool returns a formatted status of the latest pipeline:<br>- Workflow names and their current status<br>- Duration of each workflow<br>- Creation and completion timestamps<br>- Overall pipeline health<br><br>Example output:<br>```<br>---<br>Workflow: build<br>Status: success<br>Duration: 5 minutes<br>Created: 4/20/2025, 10:15:30 AM<br>Stopped: 4/20/2025, 10:20:45 AM<br>---<br>Workflow: test<br>Status: running<br>Duration: unknown<br>Created: 4/20/2025, 10:21:00 AM<br>Stopped: in progress<br>```<br><br>This is particularly useful for:<br>- Checking the status of the latest pipeline<br>- Getting the status of the latest pipeline for a specific branch<br>- Quickly checking the status of the latest pipeline without leaving your IDE |
| `get_job_test_results` | Retrieves test metadata for CircleCI jobs, allowing you to analyze test results without leaving your IDE. This tool can be used in three ways:<br><br>1. Using Project Slug and Branch (Recommended Workflow):<br>   - First, list your available projects:<br>     - Use the list_followed_projects tool to get your projects<br>     - Example: "List my CircleCI projects"<br>     - Then choose the project, which has a projectSlug associated with it<br>     - Example: "Lets use my-project"<br>   - Then ask to retrieve the test results for a specific branch:<br>     - Example: "Get test results for my-project on the main branch"<br><br>2. Using CircleCI URL:<br>   - Provide a CircleCI URL in any of these formats:<br>     - Job URL: "https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def/jobs/789"<br>     - Workflow URL: "https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def"<br>     - Pipeline URL: "https://app.circleci.com/pipelines/github/org/repo/123"<br>   - Example: "Get test results for https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def"<br><br>3. Using Local Project Context:<br>   - Works from your local workspace by providing:<br>     - Workspace root path<br>     - Git remote URL<br>     - Branch name<br>   - Example: "Get test results for my current project on the main branch"<br><br>The tool returns detailed test result information:<br>- Summary of all tests (total, successful, failed)<br>- Detailed information about failed tests including:<br>  - Test name and class<br>  - File location<br>  - Error messages<br>  - Runtime duration<br>- List of successful tests with timing information<br>- Filter by tests result<br><br>This is particularly useful for:<br>- Quickly analyzing test failures without visiting the CircleCI web UI<br>- Identifying patterns in test failures<br>- Finding slow tests that might need optimization<br>- Checking test coverage across your project<br>- Troubleshooting flaky tests<br><br>Note: The tool requires that test metadata is properly configured in your CircleCI config. For more information on setting up test metadata collection, see:<br>https://circleci.com/docs/collect-test-data/ |
| `config_helper` | Assists with CircleCI configuration tasks by providing guidance and validation. This tool helps you:<br><br>1. Validate CircleCI Config:<br>   - Checks your .circleci/config.yml for syntax and semantic errors<br>   - Example: "Validate my CircleCI config"<br><br>The tool provides:<br>- Detailed validation results<br>- Configuration recommendations<br><br>This helps you:<br>- Catch configuration errors before pushing<br>- Learn CircleCI configuration best practices<br>- Troubleshoot configuration issues<br>- Implement CircleCI features correctly |
| `create_prompt_template` | Helps generate structured prompt templates for AI-enabled applications based on feature requirements. This tool:<br><br>1. Converts Feature Requirements to Structured Prompts:<br>   - Transforms user requirements into optimized prompt templates<br>   - Example: "Create a prompt template for generating bedtime stories by age and topic"<br><br>The tool provides:<br>- A structured prompt template<br>- A context schema defining required input parameters<br><br>This helps you:<br>- Create effective prompts for AI applications<br>- Standardize input parameters for consistent results<br>- Build robust AI-powered features |
| `recommend_prompt_template_tests` | Generates test cases for prompt templates to ensure they produce expected results. This tool:<br><br>1. Provides Test Cases for Prompt Templates:<br>   - Creates diverse test scenarios based on your prompt template and context schema<br>   - Example: "Generate tests for my bedtime story prompt template"<br><br>The tool provides:<br>- An array of recommended test cases<br>- Various parameter combinations to test template robustness<br><br>This helps you:<br>- Validate prompt template functionality<br>- Ensure consistent AI responses across inputs<br>- Identify edge cases and potential issues<br>- Improve overall AI application quality |
| `list_followed_projects` | Lists all projects that the user is following on CircleCI. This tool:<br><br>1. Retrieves and Displays Projects:<br>   - Shows all projects the user has access to and is following<br>   - Provides the project name and projectSlug for each entry<br>   - Example: "List my CircleCI projects"<br><br>The tool returns a formatted list of projects, example output:<br>```<br>Projects followed:<br>1. my-project (projectSlug: gh/organization/my-project)<br>2. another-project (projectSlug: gh/organization/another-project)<br>```<br><br>This is particularly useful for:<br>- Identifying which CircleCI projects are available to you<br>- Obtaining the projectSlug needed for other CircleCI tools<br>- Selecting a project for subsequent operations<br><br>Note: The projectSlug (not the project name) is required for many other CircleCI tools, and will be used for those tool calls after a project is selected. |
| `run_pipeline` | Triggers a pipeline to run. This tool can be used in three ways:<br><br>1. Using Project Slug and Branch (Recommended Workflow):<br>   - First, list your available projects:<br>     - Use the list_followed_projects tool to get your projects<br>     - Example: "List my CircleCI projects"<br>     - Then choose the project, which has a projectSlug associated with it<br>     - Example: "Lets use my-project"<br>   - Then ask to run the pipeline for a specific branch:<br>     - Example: "Run the pipeline for my-project on the main branch"<br><br>2. Using CircleCI URL:<br>   - Provide a CircleCI URL in any of these formats:<br>     - Job URL: "https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def/jobs/789"<br>     - Workflow URL: "https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def"<br>     - Pipeline URL: "https://app.circleci.com/pipelines/github/org/repo/123"<br>     - Project URL with branch: "https://app.circleci.com/projects/github/org/repo?branch=main"<br>   - Example: "Run the pipeline for https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def"<br><br>3. Using Local Project Context:<br>   - Works from your local workspace by providing:<br>     - Workspace root path<br>     - Git remote URL<br>     - Branch name<br>   - Example: "Run the pipeline for my current project on the main branch"<br><br>The tool returns a link to monitor the pipeline execution.<br><br>This is particularly useful for:<br>- Quickly running pipelines without visiting the CircleCI web UI<br>- Running pipelines from a specific branch |

# Development

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/CircleCI-Public/mcp-server-circleci.git
   cd mcp-server-circleci
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

## Development with MCP Inspector

The easiest way to iterate on the MCP Server is using the MCP inspector. You can learn more about the MCP inspector at https://modelcontextprotocol.io/docs/tools/inspector

1. Start the development server:

   ```bash
   pnpm watch # Keep this running in one terminal
   ```

2. In a separate terminal, launch the inspector:

   ```bash
   pnpm inspector
   ```

3. Configure the environment:
   - Add your `CIRCLECI_TOKEN` to the Environment Variables section in the inspector UI
   - The token needs read access to your CircleCI projects
   - Optionally you can set your CircleCI Base URL. Defaults to `https//circleci.com`

## Testing

- Run the test suite:

  ```bash
  pnpm test
  ```

- Run tests in watch mode during development:
  ```bash
  pnpm test:watch
  ```

For more detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)

# CircleCI MCP Server

[![GitHub](https://img.shields.io/github/license/CircleCI-Public/mcp-server-circleci)](https://github.com/CircleCI-Public/mcp-server-circleci/blob/main/LICENSE)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/CircleCI-Public/mcp-server-circleci/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/CircleCI-Public/mcp-server-circleci/tree/main)
[![npm](https://img.shields.io/npm/v/@circleci/mcp-server-circleci?logo=npm)](https://www.npmjs.com/package/@circleci/mcp-server-circleci)

Model Context Protocol (MCP) is a [new, standardized protocol](https://modelcontextprotocol.io/introduction) for managing context between large language models (LLMs) and external systems. In this repository, we provide an MCP Server for [CircleCI](https://circleci.com).

This lets you use Cursor IDE, or any MCP Client, to use natural language to accomplish things with CircleCI, e.g.:

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

- `get_build_failure_logs`

  Retrieves detailed failure logs from CircleCI builds. This tool can be used in two ways:

  1. Using CircleCI URLs:

     - Provide a failed job URL or pipeline URL directly
     - Example: "Get logs from https://app.circleci.com/pipelines/github/org/repo/123"

  2. Using Local Project Context:
     - Works from your local workspace by providing:
       - Workspace root path
       - Git remote URL
       - Branch name
     - Example: "Find the latest failed pipeline on my current branch"

  The tool returns formatted logs including:

  - Job names
  - Step-by-step execution details
  - Failure messages and context

  This is particularly useful for:

  - Debugging failed builds
  - Analyzing test failures
  - Investigating deployment issues
  - Quick access to build logs without leaving your IDE

- `find_flaky_tests`

  Identifies flaky tests in your CircleCI project by analyzing test execution history. This leverages the flaky test detection feature described here: https://circleci.com/blog/introducing-test-insights-with-flaky-test-detection/#flaky-test-detection

  This tool can be used in two ways:

  1. Using CircleCI Project URL:

     - Provide the project URL directly from CircleCI
     - Example: "Find flaky tests in https://app.circleci.com/pipelines/github/org/repo"

  2. Using Local Project Context:
     - Works from your local workspace by providing:
       - Workspace root path
       - Git remote URL
     - Example: "Find flaky tests in my current project"

  The tool returns detailed information about flaky tests, including:

  - Test names and file locations
  - Failure messages and contexts

  This helps you:

  - Identify unreliable tests in your test suite
  - Get detailed context about test failures
  - Make data-driven decisions about test improvements

- `get_latest_pipeline_status`

  Retrieves the status of the latest pipeline for a given branch. This tool can be used in two ways:

  1. Using CircleCI Project URL:

     - Provide the project URL directly from CircleCI
     - Example: "Get the status of the latest pipeline for https://app.circleci.com/pipelines/github/org/repo"

  2. Using Local Project Context:
     - Works from your local workspace by providing:
       - Workspace root path
       - Git remote URL
       - Branch name
     - Example: "Get the status of the latest pipeline for my current project"

  The tool returns a formatted status of the latest pipeline:

  - Workflow names and their current status
  - Duration of each workflow
  - Creation and completion timestamps
  - Overall pipeline health

  Example output:

  ```
  ---
  Workflow: build
  Status: success
  Duration: 5 minutes
  Created: 4/20/2025, 10:15:30 AM
  Stopped: 4/20/2025, 10:20:45 AM
  ---
  Workflow: test
  Status: running
  Duration: unknown
  Created: 4/20/2025, 10:21:00 AM
  Stopped: in progress
  ```

  This is particularly useful for:

  - Checking the status of the latest pipeline
  - Getting the status of the latest pipeline for a specific branch
  - Quickly checking the status of the latest pipeline without leaving your IDE

- `get_job_test_results`

  Retrieves test metadata for CircleCI jobs, allowing you to analyze test results without leaving your IDE. This tool can be used in two ways:

  1. Using CircleCI URL (Recommended):

     - Provide a CircleCI URL in any of these formats:
       - Job URL: "https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def/jobs/789"
       - Workflow URL: "https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def"
       - Pipeline URL: "https://app.circleci.com/pipelines/github/org/repo/123"
     - Example: "Get test results for https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def"

  2. Using Local Project Context:
     - Works from your local workspace by providing:
       - Workspace root path
       - Git remote URL
       - Branch name
     - Example: "Get test results for my current project on the main branch"

  The tool returns detailed test result information:

  - Summary of all tests (total, successful, failed)
  - Detailed information about failed tests including:
    - Test name and class
    - File location
    - Error messages
    - Runtime duration
  - List of successful tests with timing information

  This is particularly useful for:

  - Quickly analyzing test failures without visiting the CircleCI web UI
  - Identifying patterns in test failures
  - Finding slow tests that might need optimization
  - Checking test coverage across your project
  - Troubleshooting flaky tests

  Note: The tool requires that test metadata is properly configured in your CircleCI config. For more information on setting up test metadata collection, see:
  https://circleci.com/docs/collect-test-data/

- `config_helper`

  Assists with CircleCI configuration tasks by providing guidance and validation. This tool helps you:

  1. Validate CircleCI Config:
     - Checks your .circleci/config.yml for syntax and semantic errors
     - Example: "Validate my CircleCI config"

  The tool provides:

  - Detailed validation results
  - Configuration recommendations

  This helps you:

  - Catch configuration errors before pushing
  - Learn CircleCI configuration best practices
  - Troubleshoot configuration issues
  - Implement CircleCI features correctly

- `create_prompt_template`

  Helps generate structured prompt templates for AI-enabled applications based on feature requirements. This tool:

  1. Converts Feature Requirements to Structured Prompts:
     - Transforms user requirements into optimized prompt templates
     - Example: "Create a prompt template for generating bedtime stories by age and topic"

  The tool provides:

  - A structured prompt template
  - A context schema defining required input parameters

  This helps you:

  - Create effective prompts for AI applications
  - Standardize input parameters for consistent results
  - Build robust AI-powered features

- `recommend_prompt_template_tests`

  Generates test cases for prompt templates to ensure they produce expected results. This tool:

  1. Provides Test Cases for Prompt Templates:
     - Creates diverse test scenarios based on your prompt template and context schema
     - Example: "Generate tests for my bedtime story prompt template"

  The tool provides:

  - An array of recommended test cases
  - Various parameter combinations to test template robustness

  This helps you:

  - Validate prompt template functionality
  - Ensure consistent AI responses across inputs
  - Identify edge cases and potential issues
  - Improve overall AI application quality

- `run_pipeline`

  Triggers a pipeline to run. This tool can be used in two ways:

  1. Using CircleCI URL (Recommended):

     - Provide a CircleCI URL in any of these formats:
       - Job URL: "https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def/jobs/789"
       - Workflow URL: "https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def"
       - Pipeline URL: "https://app.circleci.com/pipelines/github/org/repo/123"
       - Project URL with branch: "https://app.circleci.com/projects/github/org/repo?branch=main"
     - Example: "Run the pipeline for https://app.circleci.com/pipelines/github/org/repo/123/workflows/abc-def"

  2. Using Local Project Context:
     - Works from your local workspace by providing:
       - Workspace root path
       - Git remote URL
       - Branch name
     - Example: "Run the pipeline for my current project on the main branch"

  The tool returns a link to monitor the pipeline execution.

  This is particularly useful for:

  - Quickly running pipelines without visiting the CircleCI web UI
  - Running pipelines from a specific branch

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

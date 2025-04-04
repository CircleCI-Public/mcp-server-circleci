# CircleCI MCP Server

[![GitHub](https://img.shields.io/github/license/CircleCI-Public/mcp-server-circleci)](https://github.com/CircleCI-Public/mcp-server-circleci/blob/main/LICENSE)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/CircleCI-Public/mcp-server-circleci/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/CircleCI-Public/mcp-server-circleci/tree/main)
[![npm](https://img.shields.io/npm/v/@circleci/mcp-server-circleci?logo=npm)](https://www.npmjs.com/package/@circleci/mcp-server-circleci)

Model Context Protocol (MCP) is a [new, standardized protocol](https://modelcontextprotocol.io/introduction) for managing context between large language models (LLMs) and external systems. In this repository, we provide an MCP Server for [CircleCI](https://circleci.com).

This lets you use Cursor IDE, or any MCP Client, to use natural language to accomplish things with CircleCI, e.g.:

- `Find the latest failed pipeline on my branch and get logs`

## Requirements

- pnpm package manager - [Learn more](https://pnpm.io/installation)
- Node.js >= v18.0.0
- CircleCI API token - you can generate one through the CircleCI. [Learn more](https://circleci.com/docs/managing-api-tokens/) or [click here](https://app.circleci.com/settings/user/tokens) for quick access.

## Installation

Note: The package is not yet published to npm. These installation instructions will apply once that has been done.

### Cursor

Add the following to your cursor MCP config:

```json
{
  "mcpServers": {
    "circleci-mcp-server": {
      "command": "npx",
      "args": ["-y", "@circleci/mcp-server-circleci"],
      "env": {
        "CIRCLECI_TOKEN": "your-circleci-token"
      }
    }
  }
}
```

See the guide below for more information on using MCP servers with cursor: https://docs.cursor.com/context/model-context-protocol#configuring-mcp-servers

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

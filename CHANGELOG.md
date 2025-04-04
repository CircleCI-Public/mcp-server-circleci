# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-04-04

Initial release of the CircleCI MCP Server, enabling natural language interactions with CircleCI functionality through MCP-enabled clients.

### Added

- Core MCP server implementation with CircleCI integration

  - Support for MCP protocol version 1.8.0
  - Robust error handling and response formatting
  - Standardized HTTP client for CircleCI API interactions

- CircleCI API Integration

  - Support for both CircleCI API v1.1 and v2
  - Comprehensive API client implementation for Jobs, Pipelines, and Workflows
  - Private API integration for enhanced functionality
  - Secure token-based authentication

- Build Failure Analysis Tool

  - Implemented `get_build_failure_logs` tool for retrieving detailed failure logs
  - Support for both URL-based and local project context-based queries
  - Intelligent project detection from git repository information
  - Formatted log output with job names and step-by-step execution details

- Development Tools and Infrastructure
  - Comprehensive test suite with Vitest
  - ESLint and Prettier configuration for code quality
  - TypeScript configuration for type safety
  - Development workflow with MCP Inspector support
  - Watch mode for rapid development

### Security

- Secure handling of CircleCI API tokens
- Masked sensitive data in log outputs
- Proper error handling to prevent information leakage

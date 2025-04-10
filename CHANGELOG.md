# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8] - 2025-04-10

### Fixed
- Fixed bug in flaky test detection where pipelineNumber was incorrectly used instead of projectSlug when URL not provided

### Improvements
- Consolidated project slug detection functions into a single `getPipelineNumberFromURL` function with enhanced test coverage
- Simplified build logs tool to use only `projectURL` parameter instead of separate pipeline and job URLs
- Updated tool descriptions to provide clearer guidance on accepted URL formats
- Removed redundant error handling wrapper

## [0.1.7] - 2025-04-10

### Added

- Added `find_flaky_tests` tool to identify and analyze flaky tests in CircleCI projects
  - Support for both project URL and local git repository context
  - Integration with CircleCI Insights API for flaky test detection
  - Integration with CircleCI Tests API to fetch detailed test execution results
  - Formatted output of flaky test analysis results with complete test logs

## [0.1.6] - 2025-04-09

### Added

- Added User-Agent header to CircleCI API requests

## [0.1.5] - 2025-04-08

### Added

- Support for configurable CircleCI base URL through `CIRCLECI_BASE_URL` environment variable

## [0.1.4] - 2025-04-08

### Fixed

- Handle missing job numbers in CircleCI API responses by making job_number optional in schema
- Skip jobs without job numbers when fetching job logs instead of failing

## [0.1.3] - 2025-04-04

### Added

- Improved schema validation and output formatting for job information

## [0.1.2] - 2025-04-04

### Fixed

- More permissive schema validation for CircleCI API parameters
- Allow optional parameters in API requests

### Documentation

- Updated documentation around package publishing
- Removed note about package not being published

## [0.1.1] - 2025-04-04

### Fixed

- Non functional fixes

## [0.1.0] - 2025-04-04

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

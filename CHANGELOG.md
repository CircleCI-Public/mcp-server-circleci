# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.4] - 2025-05-10

### Fixed

- Fixed project detection and pipeline number extraction from URLs with custom server domains

## [0.4.3] - 2025-05-08

### Fixed

- Fixed project detection when branch is provided in URL but not in params
- Improved error handling for failed pipeline workflow fetches
- Enhanced error messaging when project is not found or inputs are missing

## [0.4.2] - 2025-05-08

### Improvements

- Enhanced prompt template file structure and organization for consistency
  - Added standardized file naming convention for prompt templates
  - Implemented structured JSON format with required fields (name, description, version, template, contextSchema, tests, sampleInputs, etc.)
  - Added support for test case naming in Title Case format
  - Improved documentation requirements for prompt templates

## [0.4.1] - 2025-05-05

### Added

- Update project detection to correctly paginate the followed projects

## [0.4.0] - 2025-04-30

### Added

- Added `get_job_test_results` tool to retrieve and analyze test metadata from CircleCI jobs
  - Support for retrieving test results using job, workflow, or pipeline URLs
  - Support for retrieving test results using local git repository context
  - Displays comprehensive test result summary (total, successful, failed)
  - Provides detailed information for failed tests including name, class, file, error messages, and runtime
  - Lists successful tests with timing information
  - Offers actionable guidance when no test results are found
  - Includes documentation link to help users properly configure test metadata collection

## [0.3.0] - 2025-04-30

### Added

- Added `get_latest_pipeline_status` tool to get the latest pipeline status
  - Support for both project URL and local git repository context
  - Displays all workflows within the latest pipeline
  - Provides formatted details including pipeline number, workflow status, duration, and timestamps

## [0.2.0] - 2025-04-18

### Added

- Added `create_prompt_template` tool to help generate structured prompt templates

  - Converts feature requirements into optimized prompt templates
  - Generates context schema for input parameters
  - Enables building robust AI-powered features
  - Integrates with prompt template testing workflow

- Added `recommend_prompt_template_tests` tool for prompt template validation
  - Creates diverse test scenarios based on templates
  - Generates test cases with varied parameter combinations
  - Helps identify edge cases and potential issues
  - Ensures consistent AI responses across inputs

## [0.1.10] - 2025-04-17

### Fixed

- Fixed rate limiting issues when fetching job logs and flaky tests (#32)
  - Implemented `rateLimitedRequests` utility for controlled API request batching
  - Added configurable batch size and interval controls
  - Improved error handling for rate-limited responses
  - Added progress tracking for batch operations
  - Applied rate limiting fix to both job logs and flaky test detection
  - Enhanced reliability of test results retrieval

### Improvements

- Enhanced HTTP client configuration flexibility
  - Configurable base URL through environment variables
  - Better support for different CircleCI deployment scenarios
  - Streamlined client initialization process
- Added output text truncation
  - Prevents response overload by limiting output size
  - Includes clear warning when content is truncated
  - Preserves most recent and relevant information

## [0.1.9] - 2025-04-16

### Added

- Added support for API subdomain configuration in CircleCI client
  - New `useAPISubdomain` option in HTTP client configuration
  - Automatic subdomain handling for API-specific endpoints
  - Improved support for CircleCI enterprise and on-premise installations
- Added `config_helper` tool to assist with CircleCI configuration tasks
  - Support for validating .circleci/config.yml files
  - Integration with CircleCI Config Validation API
  - Detailed validation results and configuration recommendations
  - Helpful error messages and best practice suggestions

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

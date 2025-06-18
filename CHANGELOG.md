# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.1] - 2025-06-18

### Fixed

- Fixed bug in `get_flaky_tests` tool where unrelated tests were being returned
- Fixed bug in `get_flaky_tests` tool where if the output directory cannot be created the tool would respond with an error. We now throw in that case, which makes us fallback to the text output.

## [0.11.0] - 2025-06-18

### Fixed

- Fixed bug in `get_flaky_tests` tool where the same job number was being fetched multiple times
- Fixed bug in `get_flaky_tests` where the output directory was not being created when using file output mode

## [0.10.2] - 2025-06-18

### Added

- Add `speedMode` and `filterBy` parameters to the `analyze_diff` tool

## [0.10.1] - 2025-06-17

### Fixed

- Add a .gitignore file to the flaky-tests-output directory to ignore all files in the directory

## [0.10.0] - 2025-06-17

### Added

- Added `USE_FILE_OUTPUT` environment variable to `get_flaky_tests` tool
  - When set to `true`, the tool will write flaky tests to files in the `./flaky-tests-output` directory instead of returning the results in the response
  - The tool will return the file paths of the written files in the response

## [0.9.2] - 2025-06-17

### Added

- Anthropic support on prompt eval script (w. auto-detection for OpenAI and Anthropic models)
- Added `temperature` parameter support to prompt template tools
  - Enhanced `create_prompt_template` tool with configurable temperature setting
  - Enhanced `recommend_prompt_template_tests` tool with temperature parameter
  - Default temperature value set to 1.0 for consistent prompt template generation

### Updated

- Updated default model from `gpt-4o-mini` to `gpt-4.1-mini` for prompt template tools
- Enhanced evaluation script dependencies for improved compatibility
  - Updated `deepeval` to version 3.0.3+ (from 2.8.2+)
  - Updated `openai` to version 1.84.0+ (from 1.76.2+)
  - Added `anthropic` version 0.54.0+ for Anthropic model support
  - Updated `PyYAML` to version 6.0.2+

## [0.9.1] - 2025-06-12

### Added

- Added `analyze_diff` tool to analyze git diffs against cursor rules to identify rule violations
  - Evaluates code changes against repository coding standards and best practices
  - Provides detailed violation reports with confidence scores and explanations
  - Supports both staged and unstaged changes and all changes analysis
  - Returns actionable feedback for maintaining code quality consistency

## [0.9.0] - 2025-06-03

### Added

- Added `run_evaluation_tests` tool to run evaluation tests on CircleCI pipelines
  - Support for running prompt template evaluation tests in CircleCI
  - Integration with prompt template files from `./prompts` directory
  - Dynamic CircleCI configuration generation for evaluation workflows
  - Support for multiple prompt files with automatic parallelism configuration
  - Compatible with both JSON and YAML prompt template formats
  - Comprehensive error handling and validation for prompt template files
- Enhanced `runPipeline` API to support custom configuration content
  - Added `configContent` parameter to override default pipeline configuration
  - Enables dynamic pipeline configuration for specialized use cases

## [0.8.1] - 2025-05-28

### Added

- Enhanced prompt template tools with support for existing codebase prompts
  - Added `promptOrigin` parameter to distinguish between new requirements and existing codebase prompts
  - Added `model` parameter to specify target model for testing (defaults to gpt-4o-mini)
  - Enhanced documentation and examples for prompt template creation
  - Added integration guidance for codebase-sourced prompts
  - Improved prompt templates file location, naming conventions, and structure

## [0.8.0] - 2025-05-22

### Added

- Added `rerun_workflow` tool to rerun a workflow from its start or from the failed job

## [0.7.1] - 2025-05-14

### Updated

- Updated `get_build_failure_logs`, `get_job_test_results`, and `get_latest_pipeline_status` tools to require a branch parameter when using projectSlug option

## [0.7.0] - 2025-05-13

### Added

- Added `list_followed_projects` tool to list all projects that the user is following on CircleCI

## [0.6.2] - 2025-05-13

### Fixed

- Fixed `get_job_test_results` tool to filter tests by result when a job number is provided

## [0.6.1] - 2025-05-13

### Updated

- Updated `get_build_failure_logs` tool to support legacy job url format like `https://circleci.com/gh/organization/project/123`

## [0.6.0] - 2025-05-13

### Added

- Added `filterByTestsResult` parameter to `get_job_test_results` tool
  - Filter the tests by result
  - Support for filtering by `failure` or `success`

## [0.5.1] - 2025-05-12

### Added

- Fix handling of legacy job url format in tools
- Fix handling of pagination of test results when no test results are found

## [0.5.0] - 2025-05-09

### Added

- Added `run_pipeline` tool to run a pipeline
  - Support for triggering pipelines using project URL or local git repository context
  - Branch detection from URLs or local git context
  - Handles multiple pipeline definitions with interactive selection
  - Provides direct link to monitor pipeline execution

## [0.4.4] - 2025-05-08

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

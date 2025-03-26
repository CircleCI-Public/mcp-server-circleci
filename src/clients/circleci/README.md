# CircleCI API Client

A TypeScript client for interacting with the CircleCI API v2. This is an internal client library used within the MCP server for CircleCI.

## Features

- Modern TypeScript implementation
- CircleCI API v2 integration
- Built-in error handling and response interceptors
- Type-safe API methods
- Promise-based async/await interface

## Usage

```typescript
import { CircleCIClient } from './clients/circleci';

// Initialize the client with your CircleCI API token
const client = new CircleCIClient('your-circle-ci-token');

// Example: Get job details
try {
  const jobDetails = await client.jobs.getJobByNumber(
    'gh/organization/project',
    123,
  );
  console.log(jobDetails);
} catch (error) {
  console.error('Error fetching job details:', error);
}
```

## API Reference

### CircleCIClient

The main client class that provides access to all API endpoints.

```typescript
const client = new CircleCIClient(token: string)
```

#### Constructor Parameters

- `token` (string): Your CircleCI API token

#### Available APIs

- `jobs`: Access to Jobs-related endpoints
  - `getJobByNumber(projectSlug: string, jobNumber: number)`: Get details for a specific job

### Error Handling

The client includes built-in error handling that will throw descriptive errors for:

- API responses with non-2xx status codes
- Network connectivity issues
- Request setup problems

All errors include detailed messages to help with debugging.

## Contributing

This client is part of the MCP server for CircleCI. For contributions, please follow the main repository's contribution guidelines.

## License

Apache 2.0 - See [LICENSE](../../../LICENSE) for more information.

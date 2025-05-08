import {
  getPipelineNumberFromURL,
  getProjectSlugFromURL,
  getBranchFromURL,
  getJobNumberFromURL,
} from './index.js';
import { describe, it, expect } from 'vitest';

describe('getPipelineNumberFromURL', () => {
  it.each([
    // Workflow URL
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      expected: 2,
    },
    // Workflow URL
    {
      url: 'https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      expected: 123,
    },
    // Project URL (no pipeline number)
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project',
      expected: undefined,
    },
  ])('extracts pipeline number $expected from URL', ({ url, expected }) => {
    expect(getPipelineNumberFromURL(url)).toBe(expected);
  });

  it('throws error for invalid CircleCI URL format', () => {
    expect(() =>
      getPipelineNumberFromURL('https://app.circleci.com/invalid/url'),
    ).toThrow(
      'Error getting pipeline number from URL: Invalid CircleCI URL format',
    );
  });

  it('throws error when pipeline number is not a valid number', () => {
    expect(() =>
      getPipelineNumberFromURL(
        'https://app.circleci.com/pipelines/gh/organization/project/abc/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      ),
    ).toThrow('Pipeline number in URL is not a valid number');
  });
});

describe('getProjectSlugFromURL', () => {
  it.each([
    // Workflow URL
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      expected: 'gh/organization/project',
    },
    // Workflow URL
    {
      url: 'https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      expected: 'circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ',
    },
    // Pipeline URL
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/123',
      expected: 'gh/organization/project',
    },
    // Legacy Pipeline URL for gh
    {
      url: 'https://circleci.com/gh/organization/project/123',
      expected: 'gh/organization/project',
    },
    // Legacy Pipeline URL for Github
    {
      url: 'https://circleci.com/github/organization/project/123',
      expected: 'github/organization/project',
    },
    // Legacy Pipeline URL for bb
    {
      url: 'https://circleci.com/bb/organization/project/123',
      expected: 'bb/organization/project',
    },
    // Legacy Pipeline URL for Bitbucket
    {
      url: 'https://circleci.com/bitbucket/organization/project/123',
      expected: 'bitbucket/organization/project',
    },
    // Legacy Pipeline URL for CircleCI
    {
      url: 'https://circleci.com/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/456',
      expected: 'circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ',
    },
    // Pipeline URL
    {
      url: 'https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/456',
      expected: 'circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ',
    },
    // Job URL
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv/jobs/xyz789',
      expected: 'gh/organization/project',
    },
    // Job URL
    {
      url: 'https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv/jobs/def456',
      expected: 'circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ',
    },
    // Project URL
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project',
      expected: 'gh/organization/project',
    },
    // Project URL
    {
      url: 'https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ',
      expected: 'circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ',
    },
    // Project URL with query parameters
    {
      url: 'https://app.circleci.com/pipelines/github/CircleCI-Public/hungry-panda?branch=splitting',
      expected: 'github/CircleCI-Public/hungry-panda',
    },
  ])('extracts project slug $expected from URL', ({ url, expected }) => {
    expect(getProjectSlugFromURL(url)).toBe(expected);
  });

  it('throws error for invalid CircleCI URL format', () => {
    expect(() =>
      getProjectSlugFromURL('https://app.circleci.com/invalid/url'),
    ).toThrow(
      'Error getting project slug from URL: Invalid CircleCI URL format',
    );
  });

  it('throws error when project information is incomplete', () => {
    expect(() =>
      getProjectSlugFromURL('https://app.circleci.com/pipelines/gh'),
    ).toThrow('Unable to extract project information from URL');
  });
});

describe('getBranchFromURL', () => {
  it.each([
    // URL with branch parameter
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project?branch=feature-branch',
      expected: 'feature-branch',
    },
    // URL with branch parameter and other params
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project?branch=fix%2Fbug-123&filter=mine',
      expected: 'fix/bug-123',
    },
    // URL without branch parameter
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project',
      expected: undefined,
    },
    // URL with other parameters but no branch
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project?filter=mine',
      expected: undefined,
    },
  ])('extracts branch $expected from URL', ({ url, expected }) => {
    expect(getBranchFromURL(url)).toBe(expected);
  });

  it('throws error for invalid CircleCI URL format', () => {
    expect(() => getBranchFromURL('not-a-url')).toThrow(
      'Error getting branch from URL: Invalid CircleCI URL format',
    );
  });
});

describe('getJobNumberFromURL', () => {
  it.each([
    // Job URL with numeric job number
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv/jobs/456',
      expected: 456,
    },
    // Job URL with complex project path
    {
      url: 'https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv/jobs/789',
      expected: 789,
    },
    // Workflow URL (no job number)
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      expected: undefined,
    },
    // Pipeline URL (no job number)
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/123',
      expected: undefined,
    },
    // Project URL (no job number)
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project',
      expected: undefined,
    },
  ])('extracts job number $expected from URL', ({ url, expected }) => {
    expect(getJobNumberFromURL(url)).toBe(expected);
  });

  it('throws error when job number is not a valid number', () => {
    expect(() =>
      getJobNumberFromURL(
        'https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv/jobs/abc',
      ),
    ).toThrow('Job number in URL is not a valid number');
  });
});

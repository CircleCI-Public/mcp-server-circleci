import { getPipelineNumberFromURL, getProjectSlugFromURL } from './index.js';
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
  ])('extracts pipeline number $expected from URL', ({ url, expected }) => {
    expect(getPipelineNumberFromURL(url)).toBe(expected);
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
  ])('extracts project slug $expected from URL', ({ url, expected }) => {
    expect(getProjectSlugFromURL(url)).toBe(expected);
  });

  it('throws error for invalid CircleCI URL format', () => {
    expect(() =>
      getProjectSlugFromURL('https://app.circleci.com/invalid/url'),
    ).toThrow('Invalid CircleCI URL format');
  });

  it('throws error when project information is incomplete', () => {
    expect(() =>
      getProjectSlugFromURL('https://app.circleci.com/pipelines/gh'),
    ).toThrow('Unable to extract project information from URL');
  });
});

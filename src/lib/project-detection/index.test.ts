import { getPipelineNumberFromURL, getProjectSlugFromURL } from './index.js';
import { describe, it, expect } from 'vitest';

describe('getPipelineNumberFromURL', () => {
  it.each([
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      expected: '2',
    },
    {
      url: 'https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      expected: '123',
    },
  ])('extracts pipeline number $expected from URL', ({ url, expected }) => {
    expect(getPipelineNumberFromURL(url)).toBe(expected);
  });
});

describe('getProjectSlugFromURL', () => {
  it.each([
    {
      url: 'https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv',
      expected: 'gh/organization/project',
    },
    {
      url: 'https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv  ',
      expected: 'circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ',
    },
  ])('extracts project slug $expected from URL', ({ url, expected }) => {
    expect(getProjectSlugFromURL(url)).toBe(expected);
  });
});

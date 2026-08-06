import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDeprecationBanner,
  MIGRATION_URL,
  printDeprecationNotice,
  TOOL_DESCRIPTION_DEPRECATION_SUFFIX,
  withDeprecationNotice,
} from './deprecation.js';

describe('withDeprecationNotice', () => {
  it('preserves the original description', () => {
    expect(withDeprecationNotice('Does a thing.')).toContain('Does a thing.');
  });

  it('appends the migration URL', () => {
    expect(withDeprecationNotice('Does a thing.')).toContain(MIGRATION_URL);
  });

  it('instructs the model to relay the notice to the user', () => {
    expect(TOOL_DESCRIPTION_DEPRECATION_SUFFIX).toMatch(/tell the user/i);
  });

  it('separates the notice from the description so it cannot merge into a sentence', () => {
    expect(withDeprecationNotice('Ends without a period')).toContain('\n\n');
  });

  it('is idempotent per call — does not mutate its input', () => {
    const original = 'Does a thing.';
    withDeprecationNotice(original);
    expect(original).toBe('Does a thing.');
  });
});

describe('getDeprecationBanner', () => {
  it('names the package so the notice is actionable', () => {
    expect(getDeprecationBanner()).toContain('@circleci/mcp-server-circleci');
  });

  it('includes the migration URL', () => {
    expect(getDeprecationBanner()).toContain(MIGRATION_URL);
  });

  it('warns that security fixes will stop', () => {
    expect(getDeprecationBanner()).toMatch(/security fixes/i);
  });

  it('keeps the box borders aligned', () => {
    // A ragged banner reads as a rendering bug rather than an official notice.
    const boxLines = getDeprecationBanner()
      .split('\n')
      .filter((line) => line.includes('│') || line.includes('┌') || line.includes('└'));
    const widths = new Set(boxLines.map((line) => [...line].length));
    expect(boxLines.length).toBeGreaterThan(0);
    expect(widths.size).toBe(1);
  });
});

describe('printDeprecationNotice', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes to stderr', () => {
    printDeprecationNotice();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('DEPRECATED'),
    );
  });

  it('never writes to stdout — stdio mode carries JSON-RPC there', () => {
    printDeprecationNotice();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('cannot be suppressed by environment configuration', () => {
    // No opt-out by design: it would be adopted by the operators who most need
    // to migrate. Guards against one being reintroduced casually.
    for (const [key, value] of [
      ['MCP_SUPPRESS_DEPRECATION_WARNING', 'true'],
      ['SUPPRESS_DEPRECATION_WARNING', 'true'],
      ['NO_DEPRECATION_WARNING', 'true'],
    ]) {
      vi.stubEnv(key, value);
    }
    printDeprecationNotice();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('DEPRECATED'),
    );
    vi.unstubAllEnvs();
  });
});

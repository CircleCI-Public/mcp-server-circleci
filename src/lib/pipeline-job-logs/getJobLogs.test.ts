import { describe, it, expect, afterEach } from 'vitest';
import { formatJobLogs } from './getJobLogs.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const mockLogs = [
  {
    jobName: 'build',
    steps: [
      {
        stepName: 'Run tests',
        logs: { output: 'Test failed', error: 'Error: assertion failed' },
      },
    ],
  },
];

describe('formatJobLogs', () => {
  let writtenFiles: string[] = [];

  afterEach(() => {
    for (const f of writtenFiles) {
      try {
        fs.unlinkSync(f);
      } catch {}
    }
    writtenFiles = [];
  });

  it('returns inline truncated text when no outputDir is provided', () => {
    const result = formatJobLogs(mockLogs);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('build');
    expect(result.content[0].text).not.toContain('saved to');
  });

  it('returns "No logs found." when logs array is empty', () => {
    const result = formatJobLogs([]);
    expect(result.content[0].text).toBe('No logs found.');
  });

  it('writes logs to a file and returns the path when outputDir is provided', () => {
    const outputDir = os.tmpdir();
    const result = formatJobLogs(mockLogs, outputDir);

    expect(result.content[0].text).toMatch(/^Build logs saved to: /);
    const filePath = result.content[0].text.replace('Build logs saved to: ', '');
    writtenFiles.push(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(path.dirname(filePath)).toBe(path.resolve(outputDir));
    expect(path.basename(filePath)).toMatch(/^circleci-build-logs-\d+\.txt$/);
  });

  it('writes full log content to the file', () => {
    const outputDir = os.tmpdir();
    const result = formatJobLogs(mockLogs, outputDir);
    const filePath = result.content[0].text.replace('Build logs saved to: ', '');
    writtenFiles.push(filePath);

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('build');
    expect(content).toContain('Run tests');
    expect(content).toContain('Test failed');
  });

  it('resolves ~ in outputDir to the home directory', () => {
    const result = formatJobLogs(mockLogs, '~/tmp-test-circleci-logs');
    const filePath = result.content[0].text.replace('Build logs saved to: ', '');
    const dir = path.dirname(filePath);

    try {
      expect(filePath.startsWith(os.homedir())).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Regression: outputDir used to be handed straight to mkdirSync/writeFileSync,
  // letting a caller create directories and write files anywhere on the host.
  describe('outputDir containment', () => {
    it.each([
      ['a system directory', '/etc'],
      ['a traversal escape', '/tmp/../etc'],
      ['relative traversal', '../../../../../../../../etc/cron.d'],
      ['the ssh directory', '~/.ssh'],
      ['launch agents', '~/Library/LaunchAgents'],
    ])('refuses to write to %s', (_label, outputDir) => {
      const result = formatJobLogs(mockLogs, outputDir);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Refusing to write');
      expect(result.content[0].text).not.toContain('Build logs saved to');
    });

    it('does not create the rejected directory', () => {
      const target = path.join(os.homedir(), '.circleci-mcp-should-not-exist');
      const result = formatJobLogs(mockLogs, target);

      expect(result.isError).toBe(true);
      expect(fs.existsSync(target)).toBe(false);
    });
  });
});

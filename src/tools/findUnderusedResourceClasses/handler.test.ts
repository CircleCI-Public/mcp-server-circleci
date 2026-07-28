import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findUnderusedResourceClasses } from './handler.js';
import * as fs from 'fs';

vi.mock('fs');

describe('findUnderusedResourceClasses handler', () => {
  const CSV_HEADERS = 'project_name,workflow_name,job_name,resource_class,median_cpu_utilization_pct,max_cpu_utilization_pct,median_ram_utilization_pct,max_ram_utilization_pct,compute_credits';
  const CSV_ROW_UNDER = 'proj,flow,build,medium,10,20,15,18,100';
  const CSV_ROW_OVER = 'proj,flow,test,large,50,60,55,58,200';

  beforeEach(() => {
    vi.clearAllMocks();
    (fs.existsSync as any).mockReturnValue(true);
  });

  it('returns an error if file read fails', async () => {
    (fs.readFileSync as any).mockImplementation(() => { throw new Error('fail'); });
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } }, undefined as any);
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('Could not read CSV file');
  });

  it('returns an error if CSV is missing required columns', async () => {
    (fs.readFileSync as any).mockReturnValue('bad_col1,bad_col2\n1,2');
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } }, undefined as any);
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('missing required columns');
  });

  it('returns a no-underused message if all jobs are above threshold', async () => {
    (fs.readFileSync as any).mockReturnValue(`${CSV_HEADERS}\n${CSV_ROW_OVER}`);
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } }, undefined as any);
    expect(result.content[0].text).toContain('No underused resource classes found');
  });

  it('returns a report when underused jobs are found', async () => {
    (fs.readFileSync as any).mockReturnValue(`${CSV_HEADERS}\n${CSV_ROW_UNDER}\n${CSV_ROW_OVER}`);
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } }, undefined as any);
    expect(result.content[0].text).toContain('Underused resource classes');
    expect(result.content[0].text).toContain('build');
  });

  // Regression: csvFilePath was passed to readFileSync(path.resolve(...)) with
  // no containment, so any file the process could open was readable.
  describe('csvFilePath containment', () => {
    it.each([
      ['the password file', '/etc/passwd'],
      ['an ssh private key', '~/.ssh/id_rsa'],
      ['a traversal escape', '/tmp/../etc/shadow'],
      ['aws credentials', '~/.aws/credentials'],
    ])('refuses to read %s', async (_label, csvFilePath) => {
      const result = await findUnderusedResourceClasses(
        { params: { csvFilePath, threshold: 40 } },
        undefined as any,
      );

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Refusing to read');
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('rejects an escaping path in an array of part files', async () => {
      const result = await findUnderusedResourceClasses(
        { params: { csvFilePath: ['/tmp/ok.csv', '/etc/passwd'], threshold: 40 } },
        undefined as any,
      );

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Refusing to read');
    });

    it('reports the errno without leaking the host path or a stack trace', async () => {
      (fs.readFileSync as any).mockImplementation(() => {
        const error: any = new Error(
          "EACCES: permission denied, open '/Users/victim/secret/usage.csv'",
        );
        error.code = 'EACCES';
        throw error;
      });
      const result = await findUnderusedResourceClasses(
        { params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } },
        undefined as any,
      );

      expect(result.content[0].text).toContain('Could not read CSV file');
      expect(result.content[0].text).toContain('EACCES');
      // The resolved host path and any stack frames stay server-side.
      expect(result.content[0].text).not.toContain('/Users/victim');
      expect(result.content[0].text).not.toMatch(/\n\s+at\s/);
    });
  });
});

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
});

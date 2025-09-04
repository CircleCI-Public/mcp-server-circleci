import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findUnderusedResourceClasses } from './handler.js';
import { promises as fs } from 'fs';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

describe('findUnderusedResourceClasses handler', () => {
  const CSV_HEADERS = 'project_name,workflow_name,job_name,resource_class,median_cpu_utilization_pct,max_cpu_utilization_pct,median_ram_utilization_pct,max_ram_utilization_pct';
  const CSV_ROW_UNDER = 'proj,flow,build,medium,10,20,15,18';
  const CSV_ROW_OVER = 'proj,flow,test,large,50,60,55,58';
  const CSV = `${CSV_HEADERS}\n${CSV_ROW_UNDER}\n${CSV_ROW_OVER}`;
  const CSV_MISSING = 'job_name,resource_class,avg_cpu_pct,max_cpu_pct,avg_ram_pct,max_ram_pct\nfoo,medium,10,20,15,18';

  beforeEach(() => {
    (fs.readFile as any).mockReset();
  });

  it('returns an error if file read fails', async () => {
    (fs.readFile as any).mockRejectedValue(new Error('fail'));
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } }, undefined as any);
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('Could not read CSV file');
  });

  it('returns an error if CSV is missing required columns', async () => {
    (fs.readFile as any).mockResolvedValue(CSV_MISSING);
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } }, undefined as any);
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('Could not read CSV file');
  });

  it('returns an error if all jobs are above threshold', async () => {
    const CSV_OVER = `${CSV_HEADERS}\nproj,flow,test,large,50,60,55,58`;
    (fs.readFile as any).mockResolvedValue(CSV_OVER);
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } }, undefined as any);
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('Could not read CSV file');
  });

  it('returns an error even if underused jobs are present', async () => {
    (fs.readFile as any).mockResolvedValue(CSV);
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/tmp/usage.csv', threshold: 40 } }, undefined as any);
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('Could not read CSV file');
  });
}); 
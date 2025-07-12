import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadUsageApiData } from './handler.js';
import { gzipSync } from 'zlib';
import * as clientModule from '../../clients/client.js';

vi.mock('../../clients/client.js');

globalThis.fetch = vi.fn();

describe('downloadUsageApiData handler', () => {
  const ORG_ID = 'org123';
  const START = '2024-06-01';
  const END = '2024-06-30';
  const OUTPUT_DIR = '/tmp';
  const JOB_ID = 'mock-job-id';
  const DOWNLOAD_URL = 'https://example.com/usage.csv.gz';
  const GZIPPED_CSV = gzipSync('project_name,workflow_name,job_name,resource_class,median_cpu_utilization_pct,max_cpu_utilization_pct,median_ram_utilization_pct,max_ram_utilization_pct\nproj,flow,build,medium,10,20,15,18');

  let startUsageExportJobMock: any;
  let getUsageExportJobStatusMock: any;

  beforeEach(() => {
    process.env.CIRCLECI_TOKEN = 'dummy-token';
    startUsageExportJobMock = vi.fn().mockResolvedValue({ usage_export_job_id: JOB_ID });
    getUsageExportJobStatusMock = vi.fn().mockResolvedValue({ state: 'completed', download_urls: [DOWNLOAD_URL] });
    (clientModule.getCircleCIClient as any).mockReturnValue({
      usage: {
        startUsageExportJob: startUsageExportJobMock,
        getUsageExportJobStatus: getUsageExportJobStatusMock,
      },
    });
    (fetch as any).mockReset();
  });

  it('returns a success message and resource on happy path', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => GZIPPED_CSV,
      text: async () => '',
    });
    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR } }, undefined as any);
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('usage');
  });

  it('returns an error if job creation fails', async () => {
    startUsageExportJobMock.mockRejectedValueOnce(new Error('fail'));
    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR } }, undefined as any);
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('fail');
  });
}); 
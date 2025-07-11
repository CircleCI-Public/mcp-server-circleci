import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadUsageApiData } from './handler.js';
import { gzipSync } from 'zlib';

globalThis.fetch = vi.fn();

describe('downloadUsageApiData handler', () => {
  const ORG_ID = 'org123';
  const START = '2024-06-01';
  const END = '2024-06-30';
  const JOB_ID = 'job-abc';
  const DOWNLOAD_URL = 'https://circleci.com/download.csv.gz';
  const CSV_CONTENT = 'header1,header2\nvalue1,value2';
  const GZIPPED_CSV = Buffer.from(gzipSync(CSV_CONTENT));
  const OUTPUT_DIR = '/tmp';

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CIRCLECI_TOKEN = 'token';
  });

  it('should return a resource and text on success', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ usage_export_job_id: JOB_ID }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state: 'completed', download_urls: [DOWNLOAD_URL] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => GZIPPED_CSV,
      });

    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR } }, undefined as any);
    const content = result.content as any[];
    expect(content[0].type).toBe('text');
    expect(content[0].text).toContain('Usage data CSV downloaded and ready');
    expect(content[1].type).toBe('resource');
    expect(content[1].resource.uri).toBe(DOWNLOAD_URL);
    expect(Buffer.from(content[1].resource.blob, 'base64').toString()).toBe(CSV_CONTENT);
  });

  it('should return an error if CIRCLECI_TOKEN is not set', async () => {
    expect.assertions(1);
    delete process.env.CIRCLECI_TOKEN;
    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR } }, undefined as any);
    const content = result.content as any[];
    expect(result.isError).toBe(true);
    expect(content[0].text).toContain('CIRCLECI_TOKEN environment variable is not set');
  });

  it('should return an error if job creation fails', async () => {
    expect.assertions(1);
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'fail' }),
    });
    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR } }, undefined as any);
    const content = result.content as any[];
    expect(result.isError).toBe(true);
    expect(content[0].text).toContain('Failed to start usage export job');
  });

  it('should return an error if polling fails', async () => {
    expect.assertions(1);
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ usage_export_job_id: JOB_ID }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'fail' }),
      });
    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR } }, undefined as any);
    const content = result.content as any[];
    expect(result.isError).toBe(true);
    expect(content[0].text).toContain('Failed to poll usage export job');
  });

  it('should return an error if polling does not complete', async () => {
    expect.assertions(1);
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ usage_export_job_id: JOB_ID }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state: 'failed', download_urls: [] }),
      });
    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR } }, undefined as any);
    const content = result.content as any[];
    expect(result.isError).toBe(true);
    expect(content[0].text).toContain('Usage export job did not complete');
  });

  it('should return an error if CSV download fails', async () => {
    expect.assertions(1);
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ usage_export_job_id: JOB_ID }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state: 'completed', download_urls: [DOWNLOAD_URL] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR } }, undefined as any);
    const content = result.content as any[];
    expect(result.isError).toBe(true);
    expect(content[0].text).toContain('Failed to download CSV');
  });

  describe('required parameter enforcement', () => {
    const baseParams = { orgId: ORG_ID, startDate: START, endDate: END, outputDir: OUTPUT_DIR };

    it('should throw a ZodError if outputDir is missing', async () => {
      expect.assertions(1);
      // Omit outputDir
      const params = { ...baseParams } as any;
      delete params.outputDir;
      let error;
      try {
        await downloadUsageApiData({ params } as any, undefined as any);
      } catch (e) {
        error = e;
      }
      // ZodError is thrown for missing required fields
      expect(error && error.name).toBe('ZodError');
    });

    it('should succeed if all required parameters are present', async () => {
      // Mock fetch for a successful run
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ usage_export_job_id: JOB_ID }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ state: 'completed', download_urls: [DOWNLOAD_URL] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => GZIPPED_CSV,
        });
      const result = await downloadUsageApiData({ params: baseParams } as any, undefined as any);
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });
}); 
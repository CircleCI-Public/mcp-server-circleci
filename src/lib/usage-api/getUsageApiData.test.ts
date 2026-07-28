import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import * as clientModule from '../../clients/client.js';
import {
  downloadAndSaveUsageData,
  handleExistingJob,
  startNewUsageExportJob,
  getUsageApiData,
} from './getUsageApiData.js';

vi.mock('fs');
vi.mock('../../clients/client.js');

globalThis.fetch = vi.fn();

describe('Usage API Data Fetching', () => {
  const ORG_ID = 'test-org-id';
  const START_DATE = '2024-08-01T00:00:00Z';
  const END_DATE = '2024-08-31T23:59:59Z';
  const JOB_ID = 'test-job-id';
  const DOWNLOAD_URL = 'https://fake-url.com/usage.csv.gz';
  const DOWNLOAD_URL_2 = 'https://fake-url.com/usage-part2.csv.gz';
  const DOWNLOAD_URL_3 = 'https://fake-url.com/usage-part3.csv.gz';
  const OUTPUT_DIR = '/tmp/usage-data';
  // Writes go through safeWriteFileSync, which opens with O_NOFOLLOW so a
  // symlink planted at the destination filename cannot redirect the write.
  const NOFOLLOW_WRITE = { flag: expect.any(Number) };
  const MOCK_CSV_CONTENT = 'col1,col2\nval1,val2';
  const MOCK_CSV_CONTENT_2 = 'col1,col2\nval3,val4';
  const MOCK_CSV_CONTENT_3 = 'col1,col2\nval5,val6';
  const MOCK_GZIPPED_CSV = gzipSync(Buffer.from(MOCK_CSV_CONTENT));
  const MOCK_GZIPPED_CSV_2 = gzipSync(Buffer.from(MOCK_CSV_CONTENT_2));
  const MOCK_GZIPPED_CSV_3 = gzipSync(Buffer.from(MOCK_CSV_CONTENT_3));

  let mockCircleCIClient: any;
  let startUsageExportJobMock: any;
  let getUsageExportJobStatusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    startUsageExportJobMock = vi.fn().mockResolvedValue({ usage_export_job_id: JOB_ID });
    getUsageExportJobStatusMock = vi.fn();

    mockCircleCIClient = {
      usage: {
        startUsageExportJob: startUsageExportJobMock,
        getUsageExportJobStatus: getUsageExportJobStatusMock,
      },
    };

    (clientModule.getCircleCIClient as any).mockReturnValue(mockCircleCIClient);
    (fetch as any).mockReset();
    (fs.existsSync as any).mockReturnValue(true);
  });

  describe('downloadAndSaveUsageData', () => {
    it('should download, decompress, and save the CSV file correctly', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(MOCK_GZIPPED_CSV),
      });

      const result = await downloadAndSaveUsageData([DOWNLOAD_URL], OUTPUT_DIR, { startDate: START_DATE, endDate: END_DATE });

      expect(fetch).toHaveBeenCalledWith(DOWNLOAD_URL);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${OUTPUT_DIR}/usage-data-2024-08-01_2024-08-31.csv`,
        Buffer.from(MOCK_CSV_CONTENT),
        NOFOLLOW_WRITE
      );
      expect(result.content[0].text).toContain('Usage data CSV downloaded and saved to');
    });

    it('should create output directory if it does not exist', async () => {
      (fs.existsSync as any).mockReturnValue(false);
      (fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(MOCK_GZIPPED_CSV),
      });

      await downloadAndSaveUsageData([DOWNLOAD_URL], OUTPUT_DIR, { startDate: START_DATE, endDate: END_DATE });

      expect(fs.mkdirSync).toHaveBeenCalledWith(OUTPUT_DIR, { recursive: true });
    });
    
    it('should handle fetch failure gracefully', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Server Error',
            text: async () => 'Internal Server Error'
        });
        
        const result = await downloadAndSaveUsageData([DOWNLOAD_URL], OUTPUT_DIR, { startDate: START_DATE, endDate: END_DATE });
        expect(result.content[0].text).toContain('ERROR: Failed to download or save usage data');
    });

    it('should download all parts and save as separate files for multiple URLs', async () => {
      (fetch as any)
        .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(MOCK_GZIPPED_CSV) })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(MOCK_GZIPPED_CSV_2) })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(MOCK_GZIPPED_CSV_3) });

      const result = await downloadAndSaveUsageData(
        [DOWNLOAD_URL, DOWNLOAD_URL_2, DOWNLOAD_URL_3],
        OUTPUT_DIR,
        { startDate: START_DATE, endDate: END_DATE }
      );

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${OUTPUT_DIR}/usage-data-2024-08-01_2024-08-31_part1.csv`,
        Buffer.from(MOCK_CSV_CONTENT),
        NOFOLLOW_WRITE
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${OUTPUT_DIR}/usage-data-2024-08-01_2024-08-31_part2.csv`,
        Buffer.from(MOCK_CSV_CONTENT_2),
        NOFOLLOW_WRITE
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${OUTPUT_DIR}/usage-data-2024-08-01_2024-08-31_part3.csv`,
        Buffer.from(MOCK_CSV_CONTENT_3),
        NOFOLLOW_WRITE
      );
      expect(result.content[0].text).toContain('3 files');
    });

    it('should stop and return error if any part fails to download', async () => {
      (fetch as any)
        .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(MOCK_GZIPPED_CSV) })
        .mockResolvedValueOnce({ ok: false, status: 403, statusText: 'Forbidden', text: async () => 'Access Denied' });

      const result = await downloadAndSaveUsageData(
        [DOWNLOAD_URL, DOWNLOAD_URL_2],
        OUTPUT_DIR,
        { startDate: START_DATE, endDate: END_DATE }
      );

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(result.content[0].text).toContain('ERROR: Failed to download or save usage data');
    });

    // Regression: jobId/startDate/endDate were interpolated straight into the
    // filename, so a value such as "/../../../../tmp/pwned" escaped outputDir
    // entirely and gave the caller full control of the written path.
    describe('path containment', () => {
      beforeEach(() => {
        (fetch as any).mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(MOCK_GZIPPED_CSV),
        });
      });

      it.each([
        ['a rooted traversal', '/../../../../tmp/pwned'],
        ['a nested traversal', 'x/../../../../../../etc/cron.d/evil'],
        ['a parent reference', '..'],
        ['a hidden target', '/../.ssh/authorized_keys'],
      ])('keeps the file inside outputDir for jobId %s', async (_label, jobId) => {
        await downloadAndSaveUsageData([DOWNLOAD_URL], OUTPUT_DIR, { jobId });

        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        const written = (fs.writeFileSync as any).mock.calls[0][0] as string;
        // The traversal characters may survive inside the basename (harmless),
        // but the file must land as a direct child of outputDir.
        expect(path.dirname(written)).toBe(OUTPUT_DIR);
        expect(path.basename(written)).not.toMatch(/[/\\]/);
      });

      it('sanitises traversal in startDate/endDate', async () => {
        await downloadAndSaveUsageData([DOWNLOAD_URL], OUTPUT_DIR, {
          startDate: '../../../../../../../../tmp/a',
          endDate: '../../../../../../../../tmp/b',
        });

        const written = (fs.writeFileSync as any).mock.calls[0][0] as string;
        expect(path.dirname(written)).toBe(OUTPUT_DIR);
        expect(path.basename(written)).not.toMatch(/[/\\]/);
      });

      it.each([
        ['a system directory', '/etc'],
        ['a traversal escape', '/tmp/../etc'],
      ])('refuses outputDir %s', async (_label, outputDir) => {
        const result = await downloadAndSaveUsageData([DOWNLOAD_URL], outputDir, {
          jobId: JOB_ID,
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Refusing to write');
        expect(fs.writeFileSync).not.toHaveBeenCalled();
        expect(fs.mkdirSync).not.toHaveBeenCalled();
      });
    });
  });

  describe('handleExistingJob', () => {
    it('should return a "processing" message for pending jobs', async () => {
      getUsageExportJobStatusMock.mockResolvedValue({ state: 'processing' });
      const result = await handleExistingJob({ client: mockCircleCIClient, orgId: ORG_ID, jobId: JOB_ID, outputDir: OUTPUT_DIR, startDate: START_DATE, endDate: END_DATE });
      expect(result.content[0].text).toContain('still processing');
    });

    it('should return an error for a failed job status fetch', async () => {
      getUsageExportJobStatusMock.mockRejectedValue(new Error('API Error'));
      const result = await handleExistingJob({ client: mockCircleCIClient, orgId: ORG_ID, jobId: JOB_ID, outputDir: OUTPUT_DIR, startDate: START_DATE, endDate: END_DATE });
      expect(result.content[0].text).toContain('ERROR: Could not fetch job status');
    });

    it('should return an error for an unknown job state', async () => {
        getUsageExportJobStatusMock.mockResolvedValue({ state: 'exploded' });
        const result = await handleExistingJob({ client: mockCircleCIClient, orgId: ORG_ID, jobId: JOB_ID, outputDir: OUTPUT_DIR, startDate: START_DATE, endDate: END_DATE });
        expect(result.content[0].text).toContain('ERROR: Unknown job state: exploded');
    });
  });

  describe('startNewUsageExportJob', () => {
    it('should return a "started new job" message on success', async () => {
      const result = await startNewUsageExportJob({ client: mockCircleCIClient, orgId: ORG_ID, startDate: START_DATE, endDate: END_DATE });
      expect(startUsageExportJobMock).toHaveBeenCalledWith(ORG_ID, START_DATE, END_DATE);
      expect(result.content[0].text).toContain('Started a new usage export job');
      expect((result as any).jobId).toBe(JOB_ID);
    });

    it('should return an error if job creation fails', async () => {
      startUsageExportJobMock.mockRejectedValue(new Error('Creation Failed'));
      const result = await startNewUsageExportJob({ client: mockCircleCIClient, orgId: ORG_ID, startDate: START_DATE, endDate: END_DATE });
      expect(result.content[0].text).toContain('ERROR: Failed to start usage export job');
    });
  });

  describe('getUsageApiData (main dispatcher)', () => {
    it('should call handleExistingJob if a jobId is provided', async () => {
      getUsageExportJobStatusMock.mockResolvedValue({ state: 'pending' });
      await getUsageApiData({ orgId: ORG_ID, startDate: START_DATE, endDate: END_DATE, jobId: JOB_ID, outputDir: OUTPUT_DIR });
      expect(getUsageExportJobStatusMock).toHaveBeenCalledWith(ORG_ID, JOB_ID);
      expect(startUsageExportJobMock).not.toHaveBeenCalled();
    });

    it('should call startNewUsageExportJob if no jobId is provided', async () => {
      await getUsageApiData({ orgId: ORG_ID, startDate: START_DATE, endDate: END_DATE, outputDir: OUTPUT_DIR });
      expect(startUsageExportJobMock).toHaveBeenCalledWith(ORG_ID, START_DATE, END_DATE);
      expect(getUsageExportJobStatusMock).not.toHaveBeenCalled();
    });
  });
}); 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
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
  const OUTPUT_DIR = '/tmp/usage-data';
  const MOCK_CSV_CONTENT = 'col1,col2\nval1,val2';
  const MOCK_GZIPPED_CSV = gzipSync(Buffer.from(MOCK_CSV_CONTENT));

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

      const result = await downloadAndSaveUsageData(DOWNLOAD_URL, OUTPUT_DIR, { startDate: START_DATE, endDate: END_DATE });

      expect(fetch).toHaveBeenCalledWith(DOWNLOAD_URL);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${OUTPUT_DIR}/usage-data-2024-08-01_2024-08-31.csv`,
        Buffer.from(MOCK_CSV_CONTENT)
      );
      expect(result.content[0].text).toContain('Usage data CSV downloaded and saved to');
    });

    it('should create output directory if it does not exist', async () => {
      (fs.existsSync as any).mockReturnValue(false);
      (fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(MOCK_GZIPPED_CSV),
      });

      await downloadAndSaveUsageData(DOWNLOAD_URL, OUTPUT_DIR, { startDate: START_DATE, endDate: END_DATE });

      expect(fs.mkdirSync).toHaveBeenCalledWith(OUTPUT_DIR, { recursive: true });
    });
    
    it('should handle fetch failure gracefully', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Server Error',
            text: async () => 'Internal Server Error'
        });
        
        const result = await downloadAndSaveUsageData(DOWNLOAD_URL, OUTPUT_DIR, { startDate: START_DATE, endDate: END_DATE });
        expect(result.content[0].text).toContain('ERROR: Failed to download CSV');
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
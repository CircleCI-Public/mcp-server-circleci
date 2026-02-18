import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadUsageApiData } from './handler.js';
import * as getUsageApiDataModule from '../../lib/usage-api/getUsageApiData.js';

vi.mock('../../lib/usage-api/getUsageApiData.js');

describe('downloadUsageApiData handler', () => {
  const ORG_ID = 'org123';
  const OUTPUT_DIR = '/tmp';

  let getUsageApiDataSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    getUsageApiDataSpy = vi.spyOn(getUsageApiDataModule, 'getUsageApiData').mockResolvedValue({
      content: [{ type: 'text', text: 'Success' }],
    } as any);
  });

  it('should call getUsageApiData with correctly formatted dates', async () => {
    const startDate = '2024-06-01';
    const endDate = '2024-06-15';
    
    await downloadUsageApiData({ params: { orgId: ORG_ID, startDate, endDate, outputDir: OUTPUT_DIR } }, undefined as any);

    expect(getUsageApiDataSpy).toHaveBeenCalledWith({
      orgId: ORG_ID,
      startDate: '2024-06-01T00:00:00Z',
      endDate: '2024-06-15T23:59:59Z',
      outputDir: OUTPUT_DIR,
      jobId: undefined,
    });
  });

  it('should return an error if the date range is over 32 days', async () => {
    const startDate = '2024-01-01';
    const endDate = '2024-02-02';

    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate, endDate, outputDir: OUTPUT_DIR } }, undefined as any);

    expect(getUsageApiDataSpy).not.toHaveBeenCalled();
    expect((result as any).isError).toBe(true);
    expect((result as any).content[0].text).toContain('maximum allowed date range for the usage API is 32 days');
  });

  it('should return an error for an invalid date format', async () => {
    const startDate = 'not-a-date';
    const endDate = '2024-06-15';

    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate, endDate, outputDir: OUTPUT_DIR } }, undefined as any);

    expect(getUsageApiDataSpy).not.toHaveBeenCalled();
    expect((result as any).isError).toBe(true);
    expect((result as any).content[0].text).toContain('Invalid date format');
  });

  it('should return an error if the end date is before the start date', async () => {
    const startDate = '2024-06-15';
    const endDate = '2024-06-01';

    const result = await downloadUsageApiData({ params: { orgId: ORG_ID, startDate, endDate, outputDir: OUTPUT_DIR } }, undefined as any);

    expect(getUsageApiDataSpy).not.toHaveBeenCalled();
    expect((result as any).isError).toBe(true);
    expect((result as any).content[0].text).toContain('end date must be after or equal to the start date');
  });

  it('should allow polling existing job with only jobId and no dates', async () => {
    const result = await downloadUsageApiData(
      { params: { orgId: ORG_ID, jobId: 'job-abc', outputDir: OUTPUT_DIR } },
      undefined as any,
    );

    expect(getUsageApiDataSpy).toHaveBeenCalledWith({
      orgId: ORG_ID,
      startDate: undefined,
      endDate: undefined,
      outputDir: OUTPUT_DIR,
      jobId: 'job-abc',
    });
    expect((result as any).content[0].text).toContain('Success');
  });

  it('should error when neither jobId nor both dates are provided', async () => {
    const result = await downloadUsageApiData(
      { params: { orgId: ORG_ID, outputDir: OUTPUT_DIR } },
      undefined as any,
    );
    expect(getUsageApiDataSpy).not.toHaveBeenCalled();
    expect((result as any).isError).toBe(true);
    expect((result as any).content[0].text).toContain('Provide either jobId');
  });

  describe('endDate capping', () => {
    const FAKE_NOW = new Date('2026-02-18T12:00:00Z');
    const FAKE_EFFECTIVE_NOW_STR = '2026-02-18T11:59:00Z'; // effectiveNow = FAKE_NOW - 60s buffer

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FAKE_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should cap endDate when day is today with unspecified time', async () => {
      await downloadUsageApiData(
        { params: { orgId: ORG_ID, startDate: '2026-02-10', endDate: '2026-02-18', outputDir: OUTPUT_DIR } },
        undefined as any,
      );

      expect(getUsageApiDataSpy).toHaveBeenCalledWith(
        expect.objectContaining({ endDate: FAKE_EFFECTIVE_NOW_STR }),
      );
    });

    it('should not cap endDate when day is in the past', async () => {
      await downloadUsageApiData(
        { params: { orgId: ORG_ID, startDate: '2026-02-01', endDate: '2026-02-10', outputDir: OUTPUT_DIR } },
        undefined as any,
      );

      expect(getUsageApiDataSpy).toHaveBeenCalledWith(
        expect.objectContaining({ endDate: '2026-02-10T23:59:59Z' }),
      );
    });
  });
}); 
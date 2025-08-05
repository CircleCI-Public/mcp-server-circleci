import { describe, it, expect, vi, beforeEach } from 'vitest';
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
}); 
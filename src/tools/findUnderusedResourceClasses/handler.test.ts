import { describe, it, expect, afterEach } from 'vitest';
import { findUnderusedResourceClasses } from './handler.js';
import fs from 'fs';
import path from 'path';

const TEMP_CSV = path.join(__dirname, 'temp-usage.csv');
const DUMMY_SIGNAL = new AbortController().signal;

const CSV_HEADERS = 'job_name,resource_class,avg_cpu_pct,max_cpu_pct,avg_ram_pct,max_ram_pct';
const CSV_ROW_UNDER = 'build,medium,10,20,15,18';
const CSV_ROW_OVER = 'test,large,50,60,55,58';

describe('findUnderusedResourceClasses handler', () => {
  afterEach(() => {
    if (fs.existsSync(TEMP_CSV)) fs.unlinkSync(TEMP_CSV);
  });

  it('finds underused resource classes', async () => {
    fs.writeFileSync(TEMP_CSV, `${CSV_HEADERS}\n${CSV_ROW_UNDER}\n${CSV_ROW_OVER}`);
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: TEMP_CSV, threshold: 40 } }, { signal: DUMMY_SIGNAL });
    expect(result.content[0].text).toContain('Underused resource classes');
    expect(result.content[0].text).toContain('build');
    expect(result.content[0].text).not.toContain('test');
  });

  it('returns no underused if all above threshold', async () => {
    fs.writeFileSync(TEMP_CSV, `${CSV_HEADERS}\n${CSV_ROW_OVER}`);
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: TEMP_CSV, threshold: 40 } }, { signal: DUMMY_SIGNAL });
    expect(result.content[0].text).toContain('No underused resource classes');
  });

  it('errors if file missing', async () => {
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: '/no/such/file.csv' } }, { signal: DUMMY_SIGNAL });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Could not read CSV file');
  });

  it('errors if required columns missing', async () => {
    fs.writeFileSync(TEMP_CSV, 'foo,bar\n1,2');
    const result = await findUnderusedResourceClasses({ params: { csvFilePath: TEMP_CSV } }, { signal: DUMMY_SIGNAL });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('missing required columns');
  });
}); 
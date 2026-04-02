import { gunzipSync } from 'zlib';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

type CircleCIClient = ReturnType<typeof getCircleCIClient>;

function resolveOutputDir(outputDir: string): string {
  if (outputDir.startsWith('~')) {
    return path.join(os.homedir(), outputDir.slice(1));
  }
  if (outputDir.includes('%USERPROFILE%')) {
    const userProfile = process.env.USERPROFILE || os.homedir();
    return outputDir.replace('%USERPROFILE%', userProfile);
  }
  return outputDir;
}

function getBaseFileName(opts: { startDate?: string; endDate?: string; jobId?: string }): string {
  if (opts.startDate && opts.endDate) {
    return `usage-data-${opts.startDate.slice(0, 10)}_${opts.endDate.slice(0, 10)}`;
  }
  if (opts.jobId) {
    return `usage-data-job-${opts.jobId}`;
  }
  return `usage-data-${Date.now()}`;
}

async function fetchAndDecompress(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return gunzipSync(Buffer.from(await response.arrayBuffer()));
}

export async function downloadAndSaveUsageData(
  downloadUrls: string[],
  outputDir: string,
  opts: { startDate?: string; endDate?: string; jobId?: string }
) {
  try {
    const usageDataDir = path.resolve(resolveOutputDir(outputDir));
    fs.mkdirSync(usageDataDir, { recursive: true });

    const baseName = getBaseFileName(opts);
    const savedPaths: string[] = [];

    for (let i = 0; i < downloadUrls.length; i++) {
      const csv = await fetchAndDecompress(downloadUrls[i]);
      const suffix = downloadUrls.length > 1 ? `_part${i + 1}` : '';
      const filePath = path.join(usageDataDir, `${baseName}${suffix}.csv`);
      fs.writeFileSync(filePath, csv);
      savedPaths.push(filePath);
    }

    const summary = savedPaths.length === 1
      ? `Usage data CSV downloaded and saved to: ${savedPaths[0]}`
      : `Usage data downloaded as ${savedPaths.length} files:\n${savedPaths.join('\n')}`;
    return { content: [{ type: 'text' as const, text: summary }] };
  } catch (e: any) {
    return mcpErrorOutput(`ERROR: Failed to download or save usage data.\nError: ${e?.stack || e}`);
  }
}

export async function handleExistingJob({ client, orgId, jobId, outputDir, startDate, endDate }: { client: CircleCIClient, orgId: string, jobId: string, outputDir: string, startDate?: string, endDate?: string }) {
  let jobStatus: any;
  try {
    jobStatus = await client.usage.getUsageExportJobStatus(orgId, jobId);
  } catch (e: any) {
    return mcpErrorOutput(`ERROR: Could not fetch job status for jobId ${jobId}.\n${e?.stack || e}`);
  }

  const state = jobStatus?.state?.toLowerCase();

  switch (state) {
    case 'completed': {
      const downloadUrls = jobStatus?.download_urls;
      if (!Array.isArray(downloadUrls) || downloadUrls.length === 0) {
        return mcpErrorOutput(`ERROR: No download_urls found in job status.\nJob status: ${JSON.stringify(jobStatus, null, 2)}`);
      }
      return await downloadAndSaveUsageData(downloadUrls, outputDir, { startDate, endDate, jobId });
    }
    case 'created':
    case 'pending':
    case 'processing':
      return {
        content: [
          { type: 'text' as const, text: `Usage export job is still processing. Please try again in a minute. (Job ID: ${jobId})` }
        ],
      };
    default:
      return mcpErrorOutput(`ERROR: Unknown job state: ${state}.\nJob status: ${JSON.stringify(jobStatus, null, 2)}`);
  }
}

export async function startNewUsageExportJob({ client, orgId, startDate, endDate }: { client: CircleCIClient, orgId: string, startDate: string, endDate: string }) {
  let createJson: any;
  try {
    createJson = await client.usage.startUsageExportJob(orgId, startDate, endDate);
  } catch (e: any) {
    return mcpErrorOutput(`ERROR: Failed to start usage export job.\n${e?.stack || e}`);
  }

  const newJobId = createJson?.usage_export_job_id;
  if (!newJobId) {
    return mcpErrorOutput(`ERROR: No usage export id returned.\nResponse: ${JSON.stringify(createJson)}`);
  }

  return {
    content: [
      { type: 'text' as const, text: `Started a new usage export job for your requested date range.\n\nTo check the status or download the file, say "check status".\n\nYou do NOT need to provide the job ID; the system will track it for you automatically.\n\nJob ID: ${newJobId}` }
    ],
    jobId: newJobId
  };
}

export async function getUsageApiData({ orgId, startDate, endDate, jobId, outputDir }: { orgId: string, startDate?: string, endDate?: string, jobId?: string, outputDir: string }) {
  if (!outputDir) {
    return mcpErrorOutput('ERROR: outputDir is required. Please specify a directory to save the usage data CSV.');
  }
  const client = getCircleCIClient();

  if (jobId) {
    return await handleExistingJob({ client, orgId, jobId, outputDir, startDate, endDate });
  } else {
    if (!startDate || !endDate) {
      return mcpErrorOutput('ERROR: startDate and endDate are required when starting a new usage export job.');
    }
    return await startNewUsageExportJob({ client, orgId, startDate, endDate });
  }
} 
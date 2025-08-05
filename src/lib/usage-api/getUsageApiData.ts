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

export async function downloadAndSaveUsageData(downloadUrl: string, outputDir: string, startDate: string, endDate: string) {
  try {
    const gzippedCsvResponse = await fetch(downloadUrl);
    if (!gzippedCsvResponse.ok) {
      const csvText = await gzippedCsvResponse.text();
      return mcpErrorOutput(`ERROR: Failed to download CSV.\nStatus: ${gzippedCsvResponse.status} ${gzippedCsvResponse.statusText}\nResponse: ${csvText}`);
    }
    const gzBuffer = Buffer.from(await gzippedCsvResponse.arrayBuffer());
    const csv = gunzipSync(gzBuffer);

    const fileName = `usage-data-${startDate.slice(0, 10)}_${endDate.slice(0, 10)}.csv`;
    const usageDataDir = path.resolve(resolveOutputDir(outputDir));
    const filePath = path.join(usageDataDir, fileName);

    if (!fs.existsSync(usageDataDir)) {
      fs.mkdirSync(usageDataDir, { recursive: true });
    }
    fs.writeFileSync(filePath, csv);
    
    return {
      content: [
        { type: 'text' as const, text: `Usage data CSV downloaded and saved to: ${filePath}\n\nFolder: ${usageDataDir}\nFile: ${fileName}\n\nDEBUG INFO:\noutputDir before resolve: ${outputDir}\nusageDataDir after resolve: ${usageDataDir}` }
      ],
    };
  } catch (e: any) {
    return mcpErrorOutput(`ERROR: Failed to download or save usage data.\nError: ${e?.stack || e}`);
  }
}

export async function handleExistingJob({ client, orgId, jobId, outputDir, startDate, endDate }: { client: CircleCIClient, orgId: string, jobId: string, outputDir: string, startDate: string, endDate: string }) {
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
      const downloadUrl = Array.isArray(downloadUrls) && downloadUrls.length > 0 ? downloadUrls[0] : null;

      if (!downloadUrl) {
        return mcpErrorOutput(`ERROR: No download_url found in job status.\nJob status: ${JSON.stringify(jobStatus, null, 2)}`);
      }
      return await downloadAndSaveUsageData(downloadUrl, outputDir, startDate, endDate);
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

export async function getUsageApiData({ orgId, startDate, endDate, jobId, outputDir }: { orgId: string, startDate: string, endDate: string, jobId?: string, outputDir: string }) {
  if (!outputDir) {
    return mcpErrorOutput('ERROR: outputDir is required. Please specify a directory to save the usage data CSV.');
  }
  const client = getCircleCIClient();

  if (jobId) {
    return await handleExistingJob({ client, orgId, jobId, outputDir, startDate, endDate });
  } else {
    return await startNewUsageExportJob({ client, orgId, startDate, endDate });
  }
} 
import { gunzipSync } from 'zlib';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

function toISO8601(date: string, type: 'start' | 'end'): string {
  if (date.includes('T')) return date;
  return type === 'start'
    ? `${date}T00:00:00Z`
    : `${date}T23:59:59Z`;
}

function resolveOutputDir(outputDir: string): string {
  // Expand ~ to home directory
  if (outputDir.startsWith('~')) {
    return path.join(os.homedir(), outputDir.slice(1));
  }
  // Handle %USERPROFILE% (Windows)
  if (outputDir.includes('%USERPROFILE%')) {
    const userProfile = process.env.USERPROFILE || os.homedir();
    return outputDir.replace('%USERPROFILE%', userProfile);
  }
  // Otherwise, return as-is
  return outputDir;
}

export async function getUsageApiData({ orgId, startDate, endDate, jobId, outputDir }: { orgId: string, startDate: string, endDate: string, jobId?: string, outputDir: string }) {
  // Enforce outputDir is required
  if (!outputDir) {
    return mcpErrorOutput('ERROR: outputDir is required. Please specify a directory to save the usage data CSV.');
  }
  const client = getCircleCIClient();
  const start = toISO8601(startDate, 'start');
  const end = toISO8601(endDate, 'end');

  if (jobId) {
    // Check status of existing job
    let jobStatus: any = null;
    try {
      jobStatus = await client.usage.getUsageExportJobStatus(orgId, jobId);
    } catch (e: any) {
      return mcpErrorOutput(`ERROR: Could not fetch job status for jobId ${jobId}.\n${e && e.stack ? e.stack : e}`);
    }
    const state = (jobStatus && jobStatus.state || '').toLowerCase();
    if (state === 'completed') {
      const downloadUrls = jobStatus && jobStatus.download_urls;
      const downloadUrl = Array.isArray(downloadUrls) && downloadUrls.length > 0 ? downloadUrls[0] : null;
      if (!downloadUrl) {
        return mcpErrorOutput(`ERROR: No download_url found in job status.\nJob status: ${JSON.stringify(jobStatus, null, 2)}`);
      }
      // Download and decompress the CSV
      const csvGzRes = await fetch(downloadUrl);
      if (!csvGzRes.ok) {
        const csvText = await csvGzRes.text();
        return mcpErrorOutput(`ERROR: Failed to download CSV.\nStatus: ${csvGzRes.status} ${csvGzRes.statusText}\nResponse: ${csvText}`);
      }
      const gzBuffer = Buffer.from(await csvGzRes.arrayBuffer());
      let csv: Buffer;
      try {
        csv = gunzipSync(gzBuffer);
      } catch (e: any) {
        return mcpErrorOutput(`ERROR: Failed to decompress CSV.\nError: ${e && e.stack ? e.stack : e}`);
      }
      // Save CSV to local file in user-specified directory or current directory
      const fileName = `usage-data-${startDate}_to_${endDate}.csv`;
      // outputDir is now always required
      const usageDataDir = path.resolve(resolveOutputDir(outputDir));
      const filePath = path.join(usageDataDir, fileName);
      if (!fs.existsSync(usageDataDir)) {
        fs.mkdirSync(usageDataDir, { recursive: true });
      }
      try {
        fs.writeFileSync(filePath, csv);
      } catch (e: any) {
        return mcpErrorOutput(`ERROR: Failed to save CSV to file.\nError: ${e && e.stack ? e.stack : e}`);
      }
      return {
        content: [
          { type: 'text' as const, text: `Usage data CSV downloaded and saved to: ${filePath}\n\nFolder: ${usageDataDir}\nFile: ${fileName}\n\nDEBUG INFO:\noutputDir before resolve: ${outputDir}\nusageDataDir after resolve: ${usageDataDir}` }
        ],
      };
    } else if (state === 'created' || state === 'pending' || state === 'processing') {
      return {
        content: [
          { type: 'text' as const, text: `Usage export job is still processing. Please try again in a minute. (Job ID: ${jobId})` }
        ],
      };
    } else {
      return mcpErrorOutput(`ERROR: Unknown job state: ${state}.\nJob status: ${JSON.stringify(jobStatus, null, 2)}`);
    }
  }

  // No jobId provided, start a new job
  let createJson: any = null;
  try {
    createJson = await client.usage.startUsageExportJob(orgId, start, end);
  } catch (e: any) {
    return mcpErrorOutput(`ERROR: Failed to start usage export job.\n${e && e.stack ? e.stack : e}`);
  }
  const newJobId = createJson && createJson.usage_export_job_id;
  if (!newJobId) {
    return mcpErrorOutput(`ERROR: No usage export id returned.\nResponse: ${JSON.stringify(createJson)}`);
  }
  // Prepare a copy-paste ready message for the user
  return {
    content: [
      { type: 'text' as const, text: `Started a new usage export job for your requested date range.\n\nTo check the status or download the file, say \"check status\").\n\nYou do NOT need to provide the job ID; the system will track it for you automatically.\n\nJob ID: ${newJobId}` }
    ],
    jobId: newJobId
  };
} 
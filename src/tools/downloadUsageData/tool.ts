import fs from 'fs/promises';
import os from 'os';
import path from 'path';

export interface DownloadUsageDataParams {
  // Organization identification (multiple options)
  orgId?: string;
  orgSlug?: string;
  projectUrl?: string;
  workspaceRoot?: string;
  gitRemoteUrl?: string;
  
  // Date range
  startDate: string;
  endDate: string;
  
  // Additional options
  sharedOrgIds?: string[];
  downloadPath?: string;
  includeMetadata?: boolean;
}

export interface DownloadUsageDataResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  downloadDir?: string;
  usageType?: string;
  message?: string;
  error?: string;
  fallbackSuggestion?: string;
  
  // Metadata for automation workflows
  metadata?: {
    orgId: string;
    dateRangeRequested: { startDate: string; endDate: string };
    dateRangesProcessed: Array<{ startDate: string; endDate: string; success: boolean }>;
    totalDays: number;
    numberOfApiCalls: number;
    processingTimeMs: number;
    csvSchema?: string[];
    estimatedRowCount?: number;
  };
}

export const downloadUsageDataSchema = {
  name: "download_usage_data",
  description: `Download CircleCI usage data as CSV file for business intelligence and cost analysis. Downloads comprehensive CI/CD usage data that can be imported into data warehouses, BI tools, or analyzed with AI assistants.

🎯 DESIGNED FOR BUSINESS LEADERS & ENGINEERING MANAGERS

WHAT DATA YOU GET:
- Organization, project, pipeline, workflow, and job-level metadata
- Credit consumption data (compute, storage, network, Docker layer caching)
- Resource utilization (CPU, RAM usage percentages)
- Build performance metrics and timing data
- Team and project activity patterns

COMMON BUSINESS USE CASES:
📊 Cost Management & Optimization:
   - Track usage patterns to identify cost reduction opportunities
   - Allocate CI/CD costs to specific teams, projects, or departments
   - Support budget planning with historical usage data
   - Identify underutilized resources for scaling optimization

📈 Business Intelligence & Reporting:
   - Import into data warehouses (Snowflake, BigQuery, etc.)
   - Create dashboards in BI tools (Tableau, Power BI, Looker)
   - Generate executive reports on engineering efficiency
   - Track engineering productivity KPIs

🔍 Performance Analysis (for chained analysis tools):
   - Identify overprovisioned jobs and resource waste
   - Analyze build trends and performance bottlenecks
   - Compare usage across projects and teams
   - Spot patterns in resource consumption

⚡ DATA SPECIFICATIONS:
- Historical range: Up to 13 months back
- Window limit: Any timespan (automatically splits into 32-day chunks if needed)
- Granularity: Job-level detail (most granular available)
- Update frequency: Daily refresh through previous full day
- Export limit: 10 exports per hour per organization
- Multi-range: Automatically handles quarterly, yearly, or custom long periods

INPUT OPTIONS (choose the easiest one for you):

Option 1 - Use any CircleCI project URL from your browser:
- projectUrl: Copy any project URL from CircleCI (e.g., https://app.circleci.com/pipelines/github/mycompany/myproject)

Option 2 - Use your organization name:
- orgSlug: Your organization identifier (e.g., "gh/mycompany" for GitHub, "bb/mycompany" for Bitbucket)

Option 3 - Use from local project folder:
- workspaceRoot: Path to any project folder that uses CircleCI
- gitRemoteUrl: Your project's Git URL (optional, auto-detected if not provided)

Option 4 - If you know your org ID:
- orgId: CircleCI organization ID (for advanced users)

DATE RANGE (required):
- startDate: Start date (flexible: "Jan 1 2024", "01/01/2024", "2024-01-01", etc.)
- endDate: End date (flexible: "Jan 31 2024", "01/31/2024", "2024-01-31", etc.)

ADVANCED OPTIONS (optional):
- sharedOrgIds: Include additional organizations in the export
- downloadPath: Custom folder to save the file

💡 NEXT STEPS: After downloading, use analysis tools or upload the CSV to AI assistants to answer questions like "What are my biggest cost optimization opportunities?" or "How is usage trending across my teams?"`,
  inputSchema: {
    type: "object",
    properties: {
      projectUrl: {
        type: "string",
        description: "Any CircleCI project URL from your browser (easiest option for managers)"
      },
      orgSlug: {
        type: "string",
        description: "Organization identifier like 'gh/mycompany' or 'bb/mycompany'"
      },
      orgId: {
        type: "string",
        description: "CircleCI organization ID (if you know it)"
      },
      workspaceRoot: {
        type: "string",
        description: "Path to local project folder that uses CircleCI"
      },
      gitRemoteUrl: {
        type: "string",
        description: "Git repository URL (auto-detected if workspaceRoot provided)"
      },
      startDate: {
        type: "string", 
        description: "Start date (flexible formats: 2024-01-01, 01/01/2024, Jan 1 2024, 20240101, etc.)"
      },
      endDate: {
        type: "string",
        description: "End date (flexible formats: 2024-01-31, 01/31/2024, Jan 31 2024, 20240131, etc.)"
      },
      sharedOrgIds: {
        type: "array",
        items: { type: "string" },
        description: "Optional: Additional organization IDs to include in the export (for multi-org analysis)"
      },
      downloadPath: {
        type: "string",
        description: "Optional: Custom folder to save the CSV file"
      },
      includeMetadata: {
        type: "boolean",
        description: "Optional: Include processing metadata in response (helpful for automation workflows)"
      }
    },
    required: ["startDate", "endDate"]
  }
};

export async function downloadUsageData(params: DownloadUsageDataParams): Promise<DownloadUsageDataResult> {
  try {
    // Resolve organization ID from various input methods
    const orgId = await resolveOrganizationId(params);
    
    // Check if date range exceeds 32 days and needs to be split
    const dateRanges = splitDateRangeIfNeeded(params.startDate, params.endDate);
    
    // Determine download directory
    const downloadDir = params.downloadPath || getDefaultDownloadPath();
    
    // Ensure directory exists and is writable
    await ensureDownloadDirectory(downloadDir);
    
    let allCsvData = '';
    let totalSize = 0;
    const processedRanges: Array<{ startDate: string; endDate: string; success: boolean }> = [];
    const startTime = Date.now();
    let csvHeaders: string[] = [];
    
    // Process each date range
    for (let i = 0; i < dateRanges.length; i++) {
      const range = dateRanges[i];
      const isFirstRange = i === 0;
      
      console.log(`Processing date range ${i + 1}/${dateRanges.length}: ${range.startDate} to ${range.endDate}`);
      
      try {
        // Fetch CSV data for this range
        const csvData = await fetchUsageCSV({ 
          ...params, 
          orgId, 
          startDate: range.startDate, 
          endDate: range.endDate 
        });
        
        // Extract headers from first successful response
        if (isFirstRange && csvData.includes('\n')) {
          csvHeaders = csvData.split('\n')[0].split(',').map(h => h.trim().replace(/"/g, ''));
        }
        
        // For multiple ranges, skip the header on subsequent files
        if (!isFirstRange && csvData.includes('\n')) {
          const lines = csvData.split('\n');
          const dataWithoutHeader = lines.slice(1).join('\n');
          allCsvData += dataWithoutHeader;
        } else {
          allCsvData += csvData;
        }
        
        totalSize += csvData.length;
        processedRanges.push({ 
          startDate: range.startDate, 
          endDate: range.endDate, 
          success: true 
        });
        
        // Add small delay between API calls to be respectful of rate limits
        if (i < dateRanges.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
      } catch (error) {
        console.error(`Failed to process range ${range.startDate} to ${range.endDate}:`, error);
        // Continue with other ranges rather than failing completely
        processedRanges.push({ 
          startDate: range.startDate, 
          endDate: range.endDate, 
          success: false 
        });
      }
    }
    
    if (!allCsvData || allCsvData.trim().length === 0) {
      throw new Error('No data retrieved from any date ranges');
    }
    
    // Generate filename for merged data
    const timestamp = new Date().toISOString().split('T')[0];
    const orgCount = params.sharedOrgIds ? params.sharedOrgIds.length + 1 : 1;
    const orgSuffix = orgCount > 1 ? `-${orgCount}orgs` : '';
    const rangeLabel = dateRanges.length > 1 ? 'merged' : 'single';
    const fileName = sanitizeFileName(`circleci-usage-org-${orgId}${orgSuffix}-${params.startDate}-to-${params.endDate}-${rangeLabel}-${timestamp}.csv`);
    const filePath = path.join(downloadDir, fileName);
    
    // Write merged data to file
    await fs.writeFile(filePath, allCsvData, 'utf8');
    
    // Verify file was written
    const stats = await fs.stat(filePath);
    const endTime = Date.now();
    
    // Estimate row count (excluding header)
    const estimatedRowCount = allCsvData.split('\n').length - 1;
    
    const message = dateRanges.length > 1 
      ? `Merged data from ${dateRanges.length} date ranges into single CSV file`
      : `CSV downloaded to: ${filePath}`;
    
    const result: DownloadUsageDataResult = {
      success: true,
      filePath,
      fileName,
      fileSize: stats.size,
      downloadDir,
      usageType: dateRanges.length > 1 ? 'Multi-Range Organization Usage' : 'Organization Usage',
      message: `${message}\n\nProcessed ranges:\n${processedRanges.map(r => `- ${r.startDate} to ${r.endDate} (${r.success ? 'SUCCESS' : 'FAILED'})`).join('\n')}`
    };
    
    // Add metadata if requested (useful for automation)
    if (params.includeMetadata) {
      result.metadata = {
        orgId,
        dateRangeRequested: { startDate: params.startDate, endDate: params.endDate },
        dateRangesProcessed: processedRanges,
        totalDays: Math.ceil((new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        numberOfApiCalls: dateRanges.length,
        processingTimeMs: endTime - startTime,
        csvSchema: csvHeaders,
        estimatedRowCount
      };
    }
    
    return result;
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      fallbackSuggestion: "Try using a CircleCI project URL from your browser, or contact your development team for the organization slug"
    };
  }
}

/**
 * Split date range into 32-day chunks if needed
 * Returns array of date ranges that respect CircleCI's 32-day limit
 */
function splitDateRangeIfNeeded(startDate: string, endDate: string): Array<{startDate: string, endDate: string}> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // If within 32 days, return as single range
  if (daysDiff <= 32) {
    return [{ startDate, endDate }];
  }
  
  // Split into 32-day chunks
  const ranges: Array<{startDate: string, endDate: string}> = [];
  let currentStart = new Date(start);
  
  while (currentStart < end) {
    // Calculate end of current chunk (32 days from start, or final end date, whichever is earlier)
    const chunkEnd = new Date(currentStart);
    chunkEnd.setDate(chunkEnd.getDate() + 31); // 31 days added = 32 day window
    
    const actualChunkEnd = chunkEnd > end ? end : chunkEnd;
    
    ranges.push({
      startDate: formatDateAsYYYYMMDD(currentStart),
      endDate: formatDateAsYYYYMMDD(actualChunkEnd)
    });
    
    // Move to next chunk (start day after this chunk ends)
    currentStart = new Date(actualChunkEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  
  return ranges;
}

/**
 * Format date as YYYY-MM-DD string
 */
function formatDateAsYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultDownloadPath(): string {
  const userHome = os.homedir();
  const appDataDir = path.join(userHome, '.circleci-mcp', 'downloads');
  
  // Allow environment variable override
  return process.env.CIRCLECI_MCP_DOWNLOADS || appDataDir;
}

async function ensureDownloadDirectory(downloadDir: string): Promise<void> {
  try {
    // Check if directory exists and is writable
    await fs.access(downloadDir, fs.constants.W_OK);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, try to create it
      try {
        await fs.mkdir(downloadDir, { recursive: true, mode: 0o755 });
      } catch (createError: any) {
        throw new Error(`Cannot create download directory ${downloadDir}: ${createError.message}`);
      }
    } else if (error.code === 'EACCES') {
      throw new Error(`No write permission for directory: ${downloadDir}`);
    } else {
      throw new Error(`Cannot access download directory ${downloadDir}: ${error.message}`);
    }
  }
}

function sanitizeFileName(name: string): string {
  // Remove invalid characters for file names across platforms
  return name.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '-');
}

async function fetchUsageCSV(params: DownloadUsageDataParams & { orgId: string }): Promise<string> {
  const token = process.env.CIRCLECI_TOKEN;
  if (!token) {
    throw new Error('CIRCLECI_TOKEN environment variable is required');
  }

  const baseUrl = process.env.CIRCLECI_BASE_URL || 'https://circleci.com';
  
  // Step 1: Create usage export job
  const createPayload = {
    start: `${params.startDate}T00:00:00Z`,
    end: `${params.endDate}T23:59:59Z`,
    ...(params.sharedOrgIds && params.sharedOrgIds.length > 0 && {
      shared_org_ids: params.sharedOrgIds
    })
  };

  const createResponse = await fetch(`${baseUrl}/api/v2/organizations/${params.orgId}/usage_export_job`, {
    method: 'POST',
    headers: {
      'Circle-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!createResponse.ok) {
    if (createResponse.status === 401) {
      throw new Error('Invalid CircleCI token. Please check your CIRCLECI_TOKEN environment variable.');
    } else if (createResponse.status === 404) {
      throw new Error(`Organization not found. Please verify the org ID: ${params.orgId}`);
    } else if (createResponse.status === 429) {
      throw new Error('Rate limit exceeded. The Usage API allows only 10 requests per hour per organization.');
    } else {
      const errorText = await createResponse.text();
      throw new Error(`CircleCI API error: ${createResponse.status} ${createResponse.statusText}. ${errorText}`);
    }
  }

  const createResult = await createResponse.json();
  const jobId = createResult.usage_export_job_id;

  if (!jobId) {
    throw new Error('Failed to create usage export job - no job ID returned');
  }

  // Step 2: Poll for completion and get download URLs
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes
  const pollInterval = 10 * 1000; // 10 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const statusResponse = await fetch(`${baseUrl}/api/v2/organizations/${params.orgId}/usage_export_job/${jobId}`, {
      method: 'GET',
      headers: {
        'Circle-Token': token
      }
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check export status: ${statusResponse.status} ${statusResponse.statusText}`);
    }

    const status = await statusResponse.json();
    
    if (status.state === 'completed' && status.download_urls && status.download_urls.length > 0) {
      // Step 3: Download CSV data from the URLs
      let allCsvData = '';
      let isFirstFile = true;
      
      for (const downloadUrl of status.download_urls) {
        const csvResponse = await fetch(downloadUrl);
        if (!csvResponse.ok) {
          throw new Error(`Failed to download CSV from ${downloadUrl}: ${csvResponse.status}`);
        }
        
        let csvContent = await csvResponse.text();
        
        // For multiple files, skip the header on subsequent files
        if (!isFirstFile && csvContent.includes('\n')) {
          const lines = csvContent.split('\n');
          csvContent = lines.slice(1).join('\n'); // Skip header row
        }
        
        allCsvData += csvContent;
        isFirstFile = false;
      }
      
      if (!allCsvData || allCsvData.trim().length === 0) {
        throw new Error('Received empty CSV data from CircleCI API');
      }
      
      return allCsvData;
    } else if (status.state === 'failed') {
      throw new Error(`Usage export failed: ${status.error_reason || 'Unknown error'}`);
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Usage export timed out after 5 minutes. The export may still be processing - try again later.');
}

/**
 * Resolve organization ID from various input methods
 * Supports multiple ways to identify the organization for non-developer users
 */
async function resolveOrganizationId(params: DownloadUsageDataParams): Promise<string> {
  // Option 1: Direct org ID provided
  if (params.orgId) {
    return params.orgId;
  }

  // Option 2: Extract from project URL
  if (params.projectUrl) {
    const orgId = await extractOrgIdFromProjectUrl(params.projectUrl);
    if (orgId) return orgId;
  }

  // Option 3: Use organization slug
  if (params.orgSlug) {
    const orgId = await resolveOrgIdFromSlug(params.orgSlug);
    if (orgId) return orgId;
  }

  // Option 4: Detect from local workspace
  if (params.workspaceRoot) {
    const gitUrl = params.gitRemoteUrl || await detectGitRemoteUrl(params.workspaceRoot);
    if (gitUrl) {
      const orgId = await resolveOrgIdFromGitUrl(gitUrl);
      if (orgId) return orgId;
    }
  }

  throw new Error(`Unable to determine organization ID. Please provide one of:
- projectUrl: Any CircleCI project URL from your browser
- orgSlug: Your organization identifier (e.g., "gh/mycompany")
- orgId: Your CircleCI organization ID
- workspaceRoot: Path to a local project folder

For managers: The easiest option is to copy any project URL from CircleCI in your browser.`);
}

/**
 * Extract organization ID from a CircleCI project URL
 * Handles various URL formats that managers might copy from their browser
 */
async function extractOrgIdFromProjectUrl(projectUrl: string): Promise<string | null> {
  try {
    // Clean up the URL
    const cleanUrl = projectUrl.trim();
    
    // Extract project slug from various URL formats
    let projectSlug: string | null = null;
    
    // Format: https://app.circleci.com/pipelines/github/org/repo
    // Format: https://app.circleci.com/pipelines/gh/org/repo
    const pipelineMatch = cleanUrl.match(/\/pipelines\/(github|gh|bitbucket|bb)\/([^\/]+)\/([^\/\?]+)/);
    if (pipelineMatch) {
      const vcsType = pipelineMatch[1] === 'github' ? 'gh' : pipelineMatch[1] === 'bitbucket' ? 'bb' : pipelineMatch[1];
      projectSlug = `${vcsType}/${pipelineMatch[2]}/${pipelineMatch[3]}`;
    }

    // Format: https://app.circleci.com/projects/project-dashboard/github/org/repo
    const projectMatch = cleanUrl.match(/\/projects\/[^\/]+\/(github|gh|bitbucket|bb)\/([^\/]+)\/([^\/\?]+)/);
    if (projectMatch) {
      const vcsType = projectMatch[1] === 'github' ? 'gh' : projectMatch[1] === 'bitbucket' ? 'bb' : projectMatch[1];
      projectSlug = `${vcsType}/${projectMatch[2]}/${projectMatch[3]}`;
    }

    if (!projectSlug) {
      throw new Error('Unable to extract project information from URL');
    }

    // Get project details to find org ID
    const projectDetails = await fetchProjectDetails(projectSlug);
    return projectDetails?.organization_id || null;

  } catch (error) {
    console.error('Error extracting org ID from project URL:', error);
    return null;
  }
}

/**
 * Resolve organization ID from organization slug (e.g., "gh/mycompany")
 */
async function resolveOrgIdFromSlug(orgSlug: string): Promise<string | null> {
  try {
    // For now, we'll need to use a different approach since there's no direct org slug to ID API
    // We can try to list user's collaborations and find matching org
    const collaborations = await fetchUserCollaborations();
    
    const matchingOrg = collaborations.find((org: any) => 
      org.slug === orgSlug || 
      org.name.toLowerCase() === orgSlug.toLowerCase() ||
      `${org.vcs_type}/${org.name}` === orgSlug
    );
    
    return matchingOrg?.id || null;
  } catch (error) {
    console.error('Error resolving org ID from slug:', error);
    return null;
  }
}

/**
 * Resolve organization ID from git remote URL
 */
async function resolveOrgIdFromGitUrl(gitUrl: string): Promise<string | null> {
  try {
    // Extract owner/repo from git URL
    const match = gitUrl.match(/[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!match) return null;

    const [, owner, repo] = match;
    
    // Determine VCS type from URL
    let vcsType = 'gh'; // default to GitHub
    if (gitUrl.includes('bitbucket')) vcsType = 'bb';
    
    const projectSlug = `${vcsType}/${owner}/${repo}`;
    const projectDetails = await fetchProjectDetails(projectSlug);
    
    return projectDetails?.organization_id || null;
  } catch (error) {
    console.error('Error resolving org ID from git URL:', error);
    return null;
  }
}

/**
 * Detect git remote URL from workspace
 * Handles various git configurations and edge cases
 */
async function detectGitRemoteUrl(workspaceRoot: string): Promise<string | null> {
  try {
    // First, check if .git exists (could be file or directory)
    const gitPath = path.join(workspaceRoot, '.git');
    
    let gitDir = gitPath;
    try {
      const gitStat = await fs.stat(gitPath);
      if (gitStat.isFile()) {
        // .git is a file (git worktree case) - read the actual git directory
        const gitFileContent = await fs.readFile(gitPath, 'utf8');
        const match = gitFileContent.match(/gitdir: (.+)/);
        if (match) {
          gitDir = path.resolve(workspaceRoot, match[1].trim());
        }
      }
    } catch {
      // .git doesn't exist - not a git repository
      return null;
    }

    // Try to read the config file
    const gitConfigPath = path.join(gitDir, 'config');
    let gitConfig: string;
    
    try {
      gitConfig = await fs.readFile(gitConfigPath, 'utf8');
    } catch {
      // No git config file found
      return null;
    }
    
    // Look for remote URLs, prioritizing 'origin' but falling back to others
    const remoteMatches = gitConfig.match(/\[remote "([^"]+)"\][\s\S]*?url = ([^\n\r]+)/g);
    
    if (!remoteMatches) {
      return null;
    }

    // Parse all remotes
    const remotes: { name: string; url: string }[] = [];
    for (const match of remoteMatches) {
      const remoteMatch = match.match(/\[remote "([^"]+)"\][\s\S]*?url = ([^\n\r]+)/);
      if (remoteMatch) {
        remotes.push({
          name: remoteMatch[1],
          url: remoteMatch[2].trim()
        });
      }
    }

    // Prioritize 'origin', then 'upstream', then any other remote
    const preferredOrder = ['origin', 'upstream'];
    for (const preferredName of preferredOrder) {
      const remote = remotes.find(r => r.name === preferredName);
      if (remote) {
        return normalizeGitUrl(remote.url);
      }
    }

    // If no preferred remotes found, use the first one
    if (remotes.length > 0) {
      return normalizeGitUrl(remotes[0].url);
    }

    return null;
  } catch (error) {
    console.error('Error detecting git remote URL:', error);
    return null;
  }
}

/**
 * Normalize git URL to a standard format for parsing
 */
function normalizeGitUrl(gitUrl: string): string {
  let normalized = gitUrl.trim();
  
  // Convert SSH format to HTTPS-like format for easier parsing
  // git@github.com:owner/repo.git -> https://github.com/owner/repo.git
  if (normalized.startsWith('git@')) {
    normalized = normalized
      .replace(/^git@([^:]+):/, 'https://$1/')
      .replace(/\.git$/, '');
  }
  
  // Remove .git suffix if present
  normalized = normalized.replace(/\.git$/, '');
  
  return normalized;
}

/**
 * Fetch project details from CircleCI API
 */
async function fetchProjectDetails(projectSlug: string): Promise<any> {
  const token = process.env.CIRCLECI_TOKEN;
  const baseUrl = process.env.CIRCLECI_BASE_URL || 'https://circleci.com';
  
  const response = await fetch(`${baseUrl}/api/v2/project/${encodeURIComponent(projectSlug)}`, {
    headers: { 'Circle-Token': token! }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch project details: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Fetch user collaborations to find organization IDs
 */
async function fetchUserCollaborations(): Promise<any[]> {
  const token = process.env.CIRCLECI_TOKEN;
  const baseUrl = process.env.CIRCLECI_BASE_URL || 'https://circleci.com';
  
  const response = await fetch(`${baseUrl}/api/v2/me/collaborations`, {
    headers: { 'Circle-Token': token! }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch collaborations: ${response.status}`);
  }
  
  return await response.json();
}
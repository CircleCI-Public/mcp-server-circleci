import { downloadUsageData, DownloadUsageDataParams } from './download-usage-data.js';

/**
 * Parse various human-readable date formats into YYYY-MM-DD format
 * Supports formats like:
 * - 2024-01-01, 2024/01/01, 2024.01.01
 * - 01-01-2024, 01/01/2024, 01.01.2024
 * - 1-1-2024, 1/1/2024, 1.1.2024
 * - 20240101
 * - Jan 1 2024, January 1 2024
 * - 1 Jan 2024, 1 January 2024
 */
function parseFlexibleDate(dateInput: string): string {
  if (!dateInput || typeof dateInput !== 'string') {
    throw new Error('Date input is required and must be a string');
  }

  const input = dateInput.trim();
  
  // If already in YYYY-MM-DD format, validate and return
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${input}`);
    }
    return input;
  }

  let parsedDate: Date;

  try {
    // Try various parsing approaches
    
    // Handle YYYYMMDD format (e.g., 20240101)
    if (/^\d{8}$/.test(input)) {
      const year = input.substring(0, 4);
      const month = input.substring(4, 6);
      const day = input.substring(6, 8);
      parsedDate = new Date(`${year}-${month}-${day}`);
    }
    // Handle formats with separators: YYYY/MM/DD, YYYY.MM.DD, MM/DD/YYYY, MM-DD-YYYY, etc.
    else if (/\d+[\/\-\.]\d+[\/\-\.]\d+/.test(input)) {
      // Replace any separator with - for consistent parsing
      const normalized = input.replace(/[\/\.]/g, '-');
      const parts = normalized.split('-').map(p => p.trim());
      
      if (parts.length !== 3) {
        throw new Error('Date must have exactly 3 parts (year, month, day)');
      }

      // Determine if it's YYYY-MM-DD or MM-DD-YYYY format
      const firstPart = parseInt(parts[0]);
      const lastPart = parseInt(parts[2]);
      
      let year: number, month: number, day: number;
      
      if (firstPart > 31) {
        // First part is year (YYYY-MM-DD format)
        year = firstPart;
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else if (lastPart > 31) {
        // Last part is year (MM-DD-YYYY format)
        month = firstPart;
        day = parseInt(parts[1]);
        year = lastPart;
      } else {
        // Ambiguous - assume MM-DD-YYYY for US format preference
        month = firstPart;
        day = parseInt(parts[1]);
        year = lastPart;
        
        // If year is 2-digit, convert to 4-digit
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      }
      
      parsedDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    }
    // Handle text formats with month names (e.g., "Jan 1 2024", "1 January 2024")
    else {
      // Let JavaScript's Date parser handle text formats
      parsedDate = new Date(input);
    }

    // Validate the parsed date
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Unable to parse date: ${input}`);
    }

    // Format as YYYY-MM-DD
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;

  } catch (error) {
    throw new Error(`Invalid date format: "${input}". Please use formats like: 2024-01-01, 01/01/2024, Jan 1 2024, or 20240101`);
  }
}

export async function handleDownloadUsageData(params: any) {
  try {
    const { 
      // Organization identification options
      orgId, orgSlug, projectUrl, workspaceRoot, gitRemoteUrl,
      // Required parameters  
      startDate: rawStartDate, endDate: rawEndDate, 
      // Optional parameters
      sharedOrgIds, downloadPath 
    } = params as DownloadUsageDataParams;

    // Validate that at least one organization identification method is provided
    if (!orgId && !orgSlug && !projectUrl && !workspaceRoot) {
      return {
        content: [{
          type: "text",
          text: `❌ Organization identification required!

Please provide ONE of these options:

🔗 EASIEST: Copy any project URL from CircleCI
   Example: projectUrl="https://app.circleci.com/pipelines/github/mycompany/myproject"

🏢 Use your organization name:
   Example: orgSlug="gh/mycompany" (for GitHub) or orgSlug="bb/mycompany" (for Bitbucket)

📁 Use local project folder:
   Example: workspaceRoot="/path/to/your/project"

🆔 Advanced - if you know your org ID:
   Example: orgId="12345678-1234-1234-1234-123456789abc"

💡 TIP FOR MANAGERS: The easiest way is to go to CircleCI in your browser, click on any project, and copy the URL!`
        }],
        isError: true
      };
    }

    // Parse flexible date formats
    let startDate: string;
    let endDate: string;
    
    try {
      startDate = parseFlexibleDate(rawStartDate);
      endDate = parseFlexibleDate(rawEndDate);
    } catch (dateError) {
      return {
        content: [{
          type: "text",
          text: `Date parsing error: ${dateError instanceof Error ? dateError.message : String(dateError)}`
        }],
        isError: true
      };
    }

    // Validate date range - remove the 32-day limit since we now handle multi-range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysFromNow = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Remove 32-day limit but keep reasonable business limits
    if (daysDiff > 365) {
      return {
        content: [{
          type: "text",
          text: "⚠️ Date range exceeds 1 year (365 days).\n\nFor very large date ranges:\n- Consider breaking into smaller periods for analysis\n- Be aware that processing may take several minutes\n- Large exports may approach CircleCI's rate limits\n\nProceed with date range of 1 year or less."
        }],
        isError: true
      };
    }
    
    if (daysFromNow > 395) { // 13 months + some buffer
      return {
        content: [{
          type: "text",
          text: "Error: Start date cannot be more than 13 months ago (CircleCI Usage API limitation)."
        }],
        isError: true
      };
    }

    // Inform user if multi-range processing will occur
    if (daysDiff > 32) {
      const numRanges = Math.ceil(daysDiff / 32);
      console.log(`📅 Date range spans ${daysDiff} days, which exceeds CircleCI's 32-day limit.`);
      console.log(`🔄 Will automatically split into ${numRanges} separate API calls and merge the results.`);
      console.log(`⏱️ This may take several minutes to complete...`);
    }

    const result = await downloadUsageData({
      orgId, orgSlug, projectUrl, workspaceRoot, gitRemoteUrl,
      startDate,
      endDate,
      sharedOrgIds,
      downloadPath
    });

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: `Download failed: ${result.error}\n\nTroubleshooting:\n- Ensure you have write permissions to the download directory\n- Try setting a custom downloadPath parameter\n- Check available disk space\n- Verify your CircleCI token has access to all specified organizations\n${result.fallbackSuggestion ? `\n- ${result.fallbackSuggestion}` : ''}`
        }],
        isError: true
      };
    }

    const orgSummary = sharedOrgIds && sharedOrgIds.length > 0 
      ? `${sharedOrgIds.length + 1} organizations (primary: ${orgId}, shared: ${sharedOrgIds.join(', ')})`
      : `1 organization (${orgId})`;

    return {
      content: [{
        type: "text",
        text: `✅ Usage data downloaded successfully!\n\nFile Details:\n- Path: ${result.filePath}\n- Size: ${(result.fileSize! / 1024 / 1024).toFixed(2)} MB\n- Type: ${result.usageType}\n- Organizations: ${orgSummary}\n- Date Range: ${startDate} to ${endDate}\n\nThis file can now be used with analysis tools or uploaded to Claude for detailed insights.`
      }]
    };

  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Unexpected error downloading usage data: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
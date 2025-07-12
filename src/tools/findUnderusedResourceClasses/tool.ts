import { findUnderusedResourceClassesInputSchema } from './inputSchema.js';

export const findUnderusedResourceClassesTool = {
  name: 'find_underused_resource_classes' as const,
  description: `
    Analyzes a CircleCI usage data CSV file to find jobs/resource classes with average or max CPU/RAM usage below a given threshold (default 40%).
    This helps identify underused resource classes that may be oversized for their workload.

    Required parameter:
    - csvFilePath: Path to the usage data CSV file (string)
    Optional parameter:
    - threshold: Usage percentage threshold (number, default 40)

    The tool expects the CSV to have columns: job_name, resource_class, median_cpu_utilization_pct, max_cpu_utilization_pct, median_ram_utilization_pct, max_ram_utilization_pct (case-insensitive). These required columns are a subset of the columns in the CircleCI usage API output and the tool will work with the full set of columns from the usage API CSV.
    It returns a summary report listing all jobs/resource classes where any of these metrics is below the threshold.
  `,
  inputSchema: findUnderusedResourceClassesInputSchema,
}; 
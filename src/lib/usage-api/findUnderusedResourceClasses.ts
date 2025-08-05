import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

export function readAndParseCSV(csvFilePath: string): any[] {
  if (!csvFilePath) {
    throw new Error('csvFilePath is required');
  }
  let csvContent: string;
  try {
    csvContent = fs.readFileSync(path.resolve(csvFilePath), 'utf8');
  } catch (e: any) {
    throw new Error(`Could not read CSV file at ${csvFilePath}.\n${e?.stack || e}`);
  }
  try {
    return parse(csvContent, {
      columns: (headers: string[]) => headers.map(normalizeHeader),
      skip_empty_lines: true,
    });
  } catch (e: any) {
    throw new Error(`Failed to parse CSV.\n${e?.stack || e}`);
  }
}

export function validateCSVColumns(records: any[]): void {
  const requiredCols = [
    'project_name',
    'workflow_name',
    'job_name',
    'resource_class',
    'median_cpu_utilization_pct',
    'max_cpu_utilization_pct',
    'median_ram_utilization_pct',
    'max_ram_utilization_pct',
  ];
  const first = records[0];
  if (!first || !requiredCols.every((col) => col in first)) {
    throw new Error('CSV is missing required columns. Required: project_name, workflow_name, job_name, resource_class, median_cpu_utilization_pct, max_cpu_utilization_pct, median_ram_utilization_pct, max_ram_utilization_pct');
  }
}

export function groupRecordsByJob(records: any[]): Map<string, any[]> {
  const groupMap = new Map<string, any[]>();
  for (const row of records) {
    const key = [row.project_name, row.workflow_name, row.job_name, row.resource_class].join('|||');
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)?.push(row);
  }
  return groupMap;
}

function calculateAverages(group: any[]): { avgCpu: number; maxCpu: number; avgRam: number; maxRam: number; totalComputeCredits: number, hasData: boolean } {
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    const medianCpuArr = group.map((r: any) => parseFloat(r.median_cpu_utilization_pct)).filter(isFinite);
    const maxCpuArr = group.map((r: any) => parseFloat(r.max_cpu_utilization_pct)).filter(isFinite);
    const medianRamArr = group.map((r: any) => parseFloat(r.median_ram_utilization_pct)).filter(isFinite);
    const maxRamArr = group.map((r: any) => parseFloat(r.max_ram_utilization_pct)).filter(isFinite);
    const computeCreditsArr = group.map((r: any) => parseFloat(r.compute_credits)).filter(isFinite);

    if (!medianCpuArr.length || !maxCpuArr.length || !medianRamArr.length || !maxRamArr.length) {
        return { avgCpu: 0, maxCpu: 0, avgRam: 0, maxRam: 0, totalComputeCredits: 0, hasData: false };
    }

    return {
        avgCpu: avg(medianCpuArr),
        maxCpu: avg(maxCpuArr),
        avgRam: avg(medianRamArr),
        maxRam: avg(maxRamArr),
        totalComputeCredits: sum(computeCreditsArr),
        hasData: true
    };
}

export function analyzeJobGroups(groupedRecords: Map<string, any[]>, threshold: number): any[] {
  const underused: any[] = [];
  for (const [key, group] of groupedRecords.entries()) {
    const [projectName, workflowName, jobName, resourceClass] = key.split('|||');
    
    const { avgCpu, maxCpu, avgRam, maxRam, totalComputeCredits, hasData } = calculateAverages(group);

    if(!hasData) continue;

    if (
      (isFinite(avgCpu) && avgCpu < threshold) &&
      (isFinite(maxCpu) && maxCpu < threshold) &&
      (isFinite(avgRam) && avgRam < threshold) &&
      (isFinite(maxRam) && maxRam < threshold)
    ) {
      underused.push({
        projectName,
        workflowName,
        job: jobName,
        resourceClass,
        avgCpu: +avgCpu.toFixed(2),
        maxCpu: +maxCpu.toFixed(2),
        avgRam: +avgRam.toFixed(2),
        maxRam: +maxRam.toFixed(2),
        count: group.length,
        totalComputeCredits: +totalComputeCredits.toFixed(2),
      });
    }
  }
  return underused;
}

export function generateReport(underusedJobs: any[], threshold: number): string {
  if (underusedJobs.length === 0) {
    return `No underused resource classes found (threshold: ${threshold}%).`;
  }

  let report = `Underused resource classes (threshold: ${threshold}%):\n\n`;
  const grouped: Record<string, Record<string, any[]>> = {};
  for (const u of underusedJobs) {
    if (!grouped[u.projectName]) grouped[u.projectName] = {};
    if (!grouped[u.projectName][u.workflowName]) grouped[u.projectName][u.workflowName] = [];
    grouped[u.projectName][u.workflowName].push(u);
  }

  for (const project of Object.keys(grouped).sort()) {
    report += `## Project: ${project}\n`;
    for (const workflow of Object.keys(grouped[project]).sort()) {
      report += `### Workflow: ${workflow}\n`;
      report += 'Job Name | Resource Class | #Runs | Total Compute Credits | Avg CPU% | Max CPU% | Avg RAM% | Max RAM%\n';
      report += '|--------|---------------|-------|----------------------|----------|----------|----------|----------|\n';
      const sortedJobs = grouped[project][workflow].sort((a,b) => a.job.localeCompare(b.job));
      for (const u of sortedJobs) {
        report += `${u.job} | ${u.resourceClass} | ${u.count} | ${u.totalComputeCredits} | ${u.avgCpu} | ${u.maxCpu} | ${u.avgRam} | ${u.maxRam}\n`;
      }
      report += '\n';
    }
    report += '\n';
  }
  return report;
}

export async function findUnderusedResourceClassesFromCSV({ csvFilePath, threshold = 40 }: { csvFilePath: string, threshold?: number }) {
  const records = readAndParseCSV(csvFilePath);
  validateCSVColumns(records);
  const groupedRecords = groupRecordsByJob(records);
  const underusedJobs = analyzeJobGroups(groupedRecords, threshold);
  const report = generateReport(underusedJobs, threshold);
  
  return { report, underused: underusedJobs };
}

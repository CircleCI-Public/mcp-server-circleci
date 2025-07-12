import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

export async function findUnderusedResourceClassesFromCSV({ csvFilePath, threshold = 40 }: { csvFilePath: string, threshold?: number }) {
  if (!csvFilePath) {
    throw new Error('csvFilePath is required');
  }
  let csvContent: string;
  try {
    csvContent = fs.readFileSync(path.resolve(csvFilePath), 'utf8');
  } catch (e: any) {
    throw new Error(`Could not read CSV file at ${csvFilePath}.\n${e && e.stack ? e.stack : e}`);
  }
  let records: any[];
  try {
    records = parse(csvContent, {
      columns: (headers: string[]) => headers.map(normalizeHeader),
      skip_empty_lines: true,
    });
  } catch (e: any) {
    throw new Error(`Failed to parse CSV.\n${e && e.stack ? e.stack : e}`);
  }
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

  // Group by project_name, workflow_name, job_name, resource_class
  const groupMap = new Map();
  for (const row of records) {
    const key = [row.project_name, row.workflow_name, row.job_name, row.resource_class].join('|||');
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key).push(row);
  }

  const underused: any[] = [];
  for (const [key, group] of groupMap.entries()) {
    const [projectName, workflowName, jobName, resourceClass] = key.split('|||');
    // Compute averages over all job instances in the group
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const medianCpuArr = group.map((r: any) => parseFloat(r.median_cpu_utilization_pct)).filter(isFinite);
    const maxCpuArr = group.map((r: any) => parseFloat(r.max_cpu_utilization_pct)).filter(isFinite);
    const medianRamArr = group.map((r: any) => parseFloat(r.median_ram_utilization_pct)).filter(isFinite);
    const maxRamArr = group.map((r: any) => parseFloat(r.max_ram_utilization_pct)).filter(isFinite);
    // Removed jobRunNumberArr and totalJobRuns
    const computeCreditsArr = group.map((r: any) => parseFloat(r.compute_credits)).filter(isFinite);
    if (!medianCpuArr.length || !maxCpuArr.length || !medianRamArr.length || !maxRamArr.length) continue;
    const avgCpu = avg(medianCpuArr);
    const maxCpu = avg(maxCpuArr);
    const avgRam = avg(medianRamArr);
    const maxRam = avg(maxRamArr);
    const totalComputeCredits = sum(computeCreditsArr);
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
  let report = '';
  if (underused.length === 0) {
    report = `No underused resource classes found (threshold: ${threshold}%).`;
  } else {
    report = `Underused resource classes (threshold: ${threshold}%):\n\n`;
    // Group by project, then workflow
    const grouped: Record<string, Record<string, any[]>> = {};
    for (const u of underused) {
      if (!grouped[u.projectName]) grouped[u.projectName] = {};
      if (!grouped[u.projectName][u.workflowName]) grouped[u.projectName][u.workflowName] = [];
      grouped[u.projectName][u.workflowName].push(u);
    }
    for (const project of Object.keys(grouped)) {
      report += `Project: ${project}\n`;
      for (const workflow of Object.keys(grouped[project])) {
        report += `  Workflow: ${workflow}\n`;
        report += '    Job Name | Resource Class | #Runs | Total Compute Credits | Avg CPU% | Max CPU% | Avg RAM% | Max RAM%\n';
        report += '    --------|---------------|-------|----------------------|----------|----------|----------|----------\n';
        for (const u of grouped[project][workflow]) {
          report += `    ${u.job} | ${u.resourceClass} | ${u.count} | ${u.totalComputeCredits} | ${u.avgCpu} | ${u.maxCpu} | ${u.avgRam} | ${u.maxRam}\n`;
        }
      }
      report += '\n';
    }
  }
  return { report, underused };
} 
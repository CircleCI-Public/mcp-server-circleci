import { describe, it, expect, vi, type Mock } from 'vitest';
import {
  readAndParseCSV,
  validateCSVColumns,
  groupRecordsByJob,
  analyzeJobGroups,
  generateReport,
} from './findUnderusedResourceClasses.js';
import * as fs from 'fs';

vi.mock('fs');

describe('findUnderusedResourceClasses library functions', () => {

  const CSV_HEADERS = 'project_name,workflow_name,job_name,resource_class,median_cpu_utilization_pct,max_cpu_utilization_pct,median_ram_utilization_pct,max_ram_utilization_pct,compute_credits';
  const CSV_ROW_UNDER = 'proj,flow,build,medium,10,20,15,18,100';
  const CSV_ROW_OVER = 'proj,flow,test,large,50,60,55,58,200';
  const CSV_CONTENT = `${CSV_HEADERS}\n${CSV_ROW_UNDER}\n${CSV_ROW_OVER}`;
  const mockRecords = [
      {
        project_name: 'proj',
        workflow_name: 'flow',
        job_name: 'build',
        resource_class: 'medium',
        median_cpu_utilization_pct: '10',
        max_cpu_utilization_pct: '20',
        median_ram_utilization_pct: '15',
        max_ram_utilization_pct: '18',
        compute_credits: '100'
      },
      {
        project_name: 'proj',
        workflow_name: 'flow',
        job_name: 'test',
        resource_class: 'large',
        median_cpu_utilization_pct: '50',
        max_cpu_utilization_pct: '60',
        median_ram_utilization_pct: '55',
        max_ram_utilization_pct: '58',
        compute_credits: '200'
      }
  ];

  describe('readAndParseCSV', () => {
    it('should read and parse a CSV file correctly', () => {
      (fs.readFileSync as Mock).mockReturnValue(CSV_CONTENT);
      const records = readAndParseCSV('dummy/path.csv');
      expect(records).toHaveLength(2);
      expect(records[0].project_name).toBe('proj');
    });

    it('should throw an error if file read fails', () => {
        (fs.readFileSync as Mock).mockImplementation(() => {
            throw new Error('File not found');
        });
        expect(() => readAndParseCSV('bad/path.csv')).toThrow('Could not read CSV file');
    });
  });

  describe('validateCSVColumns', () => {
    it('should not throw an error for valid records', () => {
      expect(() => validateCSVColumns(mockRecords)).not.toThrow();
    });

    it('should throw an error for missing required columns', () => {
      const invalidRecords = [{ project_name: 'proj' }];
      expect(() => validateCSVColumns(invalidRecords)).toThrow('CSV is missing required columns');
    });
  });

  describe('groupRecordsByJob', () => {
    it('should group records by job identifier', () => {
      const grouped = groupRecordsByJob(mockRecords);
      expect(grouped.size).toBe(2);
      expect(grouped.has('proj|||flow|||build|||medium')).toBe(true);
    });
  });

  describe('analyzeJobGroups', () => {
    it('should identify underused jobs', () => {
      const grouped = groupRecordsByJob(mockRecords);
      const underused = analyzeJobGroups(grouped, 40);
      expect(underused).toHaveLength(1);
      expect(underused[0].job).toBe('build');
    });
    
    it('should return an empty array if no jobs are underused', () => {
        const grouped = groupRecordsByJob([mockRecords[1]]);
        const underused = analyzeJobGroups(grouped, 40);
        expect(underused).toHaveLength(0);
    });
  });

  describe('generateReport', () => {
    it('should generate a report for underused jobs', () => {
      const underusedJobs = [{
        projectName: 'proj',
        workflowName: 'flow',
        job: 'build',
        resourceClass: 'medium',
        avgCpu: 10,
        maxCpu: 20,
        avgRam: 15,
        maxRam: 18,
        count: 1,
        totalComputeCredits: 100
      }];
      const report = generateReport(underusedJobs, 40);
      expect(report).toContain('Underused resource classes');
      expect(report).toContain('Project: proj');
    });

    it('should generate a message when no jobs are underused', () => {
      const report = generateReport([], 40);
      expect(report).toBe('No underused resource classes found (threshold: 40%).');
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { capEndDate } from './capEndDate.js';

describe('capEndDate', () => {
  const FAKE_NOW = new Date('2026-02-18T12:00:00Z');
  const FAKE_EFFECTIVE_NOW_STR = '2026-02-18T11:59:00Z'; // effectiveNow = FAKE_NOW - 60s buffer

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return unchanged endDate when day is in the past', () => {
    expect(capEndDate('2026-02-10T23:00:00Z')).toBe('2026-02-10T23:00:00Z');
  });

  it('should return unchanged endDate when day is today and time is in the past', () => {
    expect(capEndDate('2026-02-18T10:00:00Z')).toBe('2026-02-18T10:00:00Z');
  });

  it('should cap endDate when time is within the 60-second buffer window', () => {
    expect(capEndDate('2026-02-18T11:59:30Z')).toBe(FAKE_EFFECTIVE_NOW_STR);
  });

  it('should cap endDate when day is today and time is a future time', () => {
    expect(capEndDate('2026-02-18T13:00:00Z')).toBe(FAKE_EFFECTIVE_NOW_STR);
  });

  it('should cap endDate when day is a future day', () => {
    expect(capEndDate('2026-03-01T23:59:59Z')).toBe(FAKE_EFFECTIVE_NOW_STR);
  });
});

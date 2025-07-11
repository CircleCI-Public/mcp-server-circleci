import * as chrono from 'chrono-node';

export function parseUserDate(input: string): string | null {
  const parsed = chrono.parseDate(input);
  if (!parsed) return null;
  // Format as YYYY-MM-DD
  return parsed.toISOString().slice(0, 10);
} 
import * as chrono from 'chrono-node';

/**
 * @param input The human-readable date string to parse
 * @param options An optional object to control formatting
 * @param options.defaultTime Specifies which time to append if the user did not provide one
 *   - 'start-of-day': Appends T00:00:00Z
 *   - 'end-of-day':   Appends T23:59:59Z
 * @returns A formatted date string (full ISO, or YYYY-MM-DD)
 */
export function parseDateTimeString(
  input: string,
  options?: {
    defaultTime?: 'start-of-day' | 'end-of-day';
  }
): string | null {
  const results = chrono.parse(input);
  if (!results || results.length === 0) {
    return null;
  }

  const result = results[0];
  const date = result.start.date();

  const timeSpecified =
    result.start.isCertain('hour') ||
    result.start.isCertain('minute') ||
    result.start.isCertain('second');

  if (timeSpecified) {
    return date.toISOString();
  }

  if (options?.defaultTime) {
    const dateOnly = date.toISOString().slice(0, 10);
    if (options.defaultTime === 'start-of-day') {
      return `${dateOnly}T00:00:00Z`;
    }
    return `${dateOnly}T23:59:59Z`;
  }

  return date.toISOString().slice(0, 10);
} 
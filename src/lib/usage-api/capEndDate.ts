const CLOCK_BUFFER_MS = 60 * 1_000; // 1 min buffer to guard against minor clock drift

/**
 * Caps an ISO datetime string to a safe "effective now"
 *
 * @param isoDate An ISO date string (e.g. YYYY-MM-DDTHH:mm:ssZ)
 * @returns The original string, or effectiveNow, if the input was in the future
 */
export function capEndDate(isoDate: string): string {
  const effectiveNow = new Date(Date.now() - CLOCK_BUFFER_MS);

  const input = new Date(isoDate);

  if (input > effectiveNow) {
    const cappedDate = effectiveNow.toISOString().slice(0, 19) + 'Z';
    return cappedDate;
  }

  return isoDate;
}

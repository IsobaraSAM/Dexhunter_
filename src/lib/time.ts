/**
 * Timestamp and time comparison helpers
 */

export function toMillis(timestamp?: number | string | null): number | null {
  if (timestamp === undefined || timestamp === null || timestamp === "") {
    return null;
  }

  if (typeof timestamp === "number") {
    if (isNaN(timestamp) || timestamp <= 0) return null;
    // If in seconds (Unix epoch < 100 billion, i.e. year 5138)
    if (timestamp < 100_000_000_000) {
      return timestamp * 1000;
    }
    return timestamp;
  }

  const num = Number(timestamp);
  if (!isNaN(num) && num > 0) {
    if (num < 100_000_000_000) {
      return num * 1000;
    }
    return num;
  }

  const parsed = Date.parse(timestamp);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  return null;
}

export function isNewerThan(timestamp: number | string | undefined | null, maxAgeMs: number): boolean {
  const ms = toMillis(timestamp);
  if (!ms) return false;
  return Date.now() - ms < maxAgeMs;
}



/**
 * Formats a count with thousands separators: 1234567 -> "1,234,567".
 * Missing values (null/undefined) count as 0; a real 0 stays 0.
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
  return (value ?? 0).toLocaleString("en-US");
}

/**
 * Formats an ISO date like "2011-01-25T18:44:36Z" as "January 25, 2011" (UTC).
 * Returns null when the value is missing or not a valid date.
 * @param {string | null | undefined} isoString
 * @returns {string | null}
 */
export function formatDate(isoString) {
  if (!isoString) {
    return null;
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Formats the x-ratelimit-reset header (Unix seconds) as a local time like "3:42 PM".
 * Returns null when the value is missing or invalid.
 * @param {string | null | undefined} resetSeconds
 * @returns {string | null}
 */
export function formatResetTime(resetSeconds) {
  if (!resetSeconds) {
    return null;
  }

  // JavaScript dates use milliseconds, the header uses seconds
  const date = new Date(Number(resetSeconds) * 1000);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
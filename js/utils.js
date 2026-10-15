// Shared helper functions (pure, no DOM, no network).
export const APP_NAME = "GitHub User Search";
export function validateUsername(rawValue) {
  const username = rawValue.trim();   

  if (!username) {              
    return { isValid: false, username, error: "Please enter a GitHub username." };
  }

  return { isValid: true, username, error: null };
}
/**
 * Turns the "blog" field typed by a user into a URL that is safe to use in a link.
 * Returns null when the value is missing, invalid, or not an http(s) address.
 * @param {string | null | undefined} rawValue
 * @returns {string | null}
 */
export function toSafeWebsiteUrl(rawValue) {
  const value = rawValue?.trim();

  if (!value) {
    return null;
  }

  const lower = value.toLowerCase();
  const withProtocol =
    lower.startsWith("http://") || lower.startsWith("https://")
      ? value
      : `https://${value}`;

  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  return url.href;
}


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

export function getRepositoriesNote(shownCount, totalCount) {
  if (shownCount === 0) {
    return "This user has no public repositories.";
  }

  if (totalCount > shownCount) {
    return `Showing ${formatNumber(shownCount)} of ${formatNumber(totalCount)} repositories.`;
  }

  return null ;
}
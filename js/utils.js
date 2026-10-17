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

export function filterRepositories(repos, query) {
  const needle = query.trim().toLowerCase();           // step 1

  if (!needle) {                    // step 2
    return repos;
  }

  return repos.filter((repo) =>
    [repo.name, repo.description, repo.language].some((field) => field?.toLowerCase().includes(needle))   // step 3
  );
}

/** Last update time of a repository in milliseconds (0 when missing). */
const getUpdatedTime = (repo) => Date.parse(repo.updated_at) || 0;

/** The ways the repository list can be sorted. The first one is the default. */
export const SORT_OPTIONS = [
  { key: "updated", label: "Recently updated", compare: (a, b) => getUpdatedTime(b) - getUpdatedTime(a) },
  { key: "stars", label: "Most stars", compare: (a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0) },
  { key: "name", label: "Name (A-Z)", compare: (a, b) => a.name.localeCompare(b.name) },
];

/**
 * Returns a NEW array of the repositories sorted by the given key.
 * @param {object[]} repos
 * @param {string} sortKey - one of the keys in SORT_OPTIONS
 * @returns {object[]}
 */
export function sortRepositories(repos, sortKey) {
  const option = SORT_OPTIONS.find((candidate) => candidate.key === sortKey) ?? SORT_OPTIONS[0];

  // sort() changes the array it is called on, so we sort a copy
  return [...repos].sort(option.compare);
}

/**
 * Adds up the stars of all given repositories.
 * @param {object[]} repos
 * @returns {number}
 */
export function sumStars(repos) {
  return repos.reduce((total, repo) => total + (repo.stargazers_count ?? 0), 0);
}

/**
 * One-line description of what the repository list shows.
 * @param {number} visibleCount
 * @param {number} totalCount
 * @param {number} stars
 * @returns {string}
 */
export function getRepositoriesSummary(visibleCount, totalCount, stars) {
  return `${formatNumber(visibleCount)} of ${formatNumber(totalCount)} repositories · ${formatNumber(stars)} stars`;
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
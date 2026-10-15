// API layer: the only module that talks to the GitHub API.
const API_BASE_URL = "https://api.github.com";
const NETWORK_ERROR_MESSAGE = "Network error. Check your connection and try again.";
const UNREADABLE_RESPONSE_MESSAGE =
  "GitHub sent a response we could not understand. Please try again.";
/**
 * Formats the x-ratelimit-reset header (Unix seconds) as a local time like "15:42".
 * Returns null when the value is missing or invalid.
 * @param {string | null} resetSeconds
 * @returns {string | null}
 */
function formatResetTime(resetSeconds) {
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

/**
 * Turns an HTTP error status into a message that can be shown to the user.
 */
export function describeHttpError({ status, rateLimitRemaining, rateLimitReset, username }) {
  if (status === 404) {
    return `No GitHub user named "${username}" was found.`;
  }

  const isRateLimited =
    status === 429 || (status === 403 && rateLimitRemaining === "0");

  if (isRateLimited) {
    const resetTime = formatResetTime(rateLimitReset);

    return resetTime
      ? `GitHub rate limit reached. Try again at ${resetTime}.`
      : "GitHub rate limit reached. Please try again later.";
  }

  if (status === 403) {
    return "GitHub refused the request (status 403).";
  }

  if (status >= 500) {
    return "GitHub is having problems right now. Please try again later.";
  }

  return `Unexpected response from GitHub (status ${status}).`;
}

/**
 * Sends a GET request to the GitHub API and returns the parsed JSON body.
 * @param {string} url
 * @param {string} username - used only for the "user not found" message
 * @returns {Promise<unknown>}
 */
async function fetchJson(url, username) {
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  } catch {
    // fetch rejected: no response arrived at all
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    // A response arrived, but with an error status
    throw new Error(
      describeHttpError({
        status: response.status,
        rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
        rateLimitReset: response.headers.get("x-ratelimit-reset"),
        username,
      })
    );
  }

  try {
    return await response.json();
  } catch {
    // The body is not valid JSON
    throw new Error(UNREADABLE_RESPONSE_MESSAGE);
  }
}

/**
 * Fetches the public profile of one GitHub user.
 * @param {string} username - already trimmed and non-empty
 * @returns {Promise<object>} fulfills with the user object, rejects with an Error
 */
export async function getUser(username) {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(username)}`;
  const user = await fetchJson(url, username);

  // Valid JSON, but is it what we expect?
  if (typeof user?.login !== "string") {
    throw new Error(UNREADABLE_RESPONSE_MESSAGE);
  }

  return user;
}

/**
 * Fetches the first 100 public repositories of a user (most recently updated first).
 * @param {string} username - already trimmed and non-empty
 * @returns {Promise<object[]>}
 */
export async function getRepos(username) {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;
  const repos = await fetchJson(url, username);

  const hasExpectedShape =
    Array.isArray(repos) && repos.every((repo) => typeof repo?.name === "string");

  if (!hasExpectedShape) {
    throw new Error(UNREADABLE_RESPONSE_MESSAGE);
  }

  return repos;
}
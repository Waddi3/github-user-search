// API layer: the only module that talks to the GitHub API.
import { ApiError } from "./errors.js";
const API_BASE_URL = "https://api.github.com";


/**
 * Turns an HTTP error status into a message that can be shown to the user.
 */
export function createHttpError({ status, rateLimitRemaining, rateLimitReset, username }) {
  if (status === 404) {
    return new ApiError("not-found", { status, username });
  }

  const isRateLimited = status === 429 || (status === 403 && rateLimitRemaining === "0");
  if (isRateLimited) {
    return new ApiError("rate-limit", { status, resetSeconds: rateLimitReset });
  }

  if (status === 403) {
    return new ApiError("forbidden", { status });
  }

  if (status >= 500) {
    return new ApiError("server", { status });
  }

  return new ApiError("http", { status });
}

/**
 * Sends a GET request to the GitHub API and returns the parsed JSON body.
 * @param {string} url
 * @param {string} username - used only to describe a "not found" error
 * @returns {Promise<unknown>}
 * @throws {ApiError}
 */
async function fetchJson(url, username) {
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  } catch (error) {
    // fetch rejected: no response arrived at all
    throw new ApiError("network", { cause: error });
  }

  if (!response.ok) {
    // A response arrived, but with an error status
    throw createHttpError({
      status: response.status,
      rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
      rateLimitReset: response.headers.get("x-ratelimit-reset"),
      username,
    });
  }

  try {
    return await response.json();
  } catch (error) {
    // The body is not valid JSON
    throw new ApiError("unexpected-response", { cause: error });
  }
}

/**
 * Fetches the public profile of one GitHub user.
 * @param {string} username - already trimmed and non-empty
 * @returns {Promise<object>}
 * @throws {ApiError}
 */
export async function getUser(username) {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(username)}`;
  const user = await fetchJson(url, username);

  // Valid JSON, but is it what we expect?
  if (typeof user?.login !== "string") {
    throw new ApiError("unexpected-response");
  }

  return user;
}

/**
 * Fetches the first 100 public repositories of a user (most recently updated first).
 * @param {string} username - already trimmed and non-empty
 * @returns {Promise<object[]>}
 * @throws {ApiError}
 */
export async function getRepos(username) {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;
  const repos = await fetchJson(url, username);

  const hasExpectedShape =
    Array.isArray(repos) && repos.every((repo) => typeof repo?.name === "string");

  if (!hasExpectedShape) {
    throw new ApiError("unexpected-response");
  }

  return repos;
}
// Error types: the API layer throws them, the UI layer turns them into messages.
import { formatResetTime } from "./utils.js";

/**
 * An error raised while talking to the GitHub API.
 * `kind` says WHAT happened; the other fields carry the details needed to explain it.
 */
export class ApiError extends Error {
  /**
   * @param {"network" | "not-found" | "rate-limit" | "server" | "forbidden" | "http" | "unexpected-response"} kind
   * @param {{ status?: number, username?: string, resetSeconds?: string | null, cause?: unknown }} [details]
   */
  constructor(kind, { status, username, resetSeconds, cause } = {}) {
    super(`GitHub API error: ${kind}`, { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.username = username;
    this.resetSeconds = resetSeconds;
  }
}

/**
 * Turns any error into a message that can be shown to the user.
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }

  switch (error.kind) {
    case "network":
      return "Network error. Check your connection and try again.";

    case "not-found":
      return `No GitHub user named "${error.username}" was found.`;

    case "rate-limit": {
      const resetTime = formatResetTime(error.resetSeconds);

      return resetTime
        ? `GitHub rate limit reached. Try again at ${resetTime}.`
        : "GitHub rate limit reached. Please try again later.";
    }

    case "server":
      return "GitHub is having problems right now. Please try again later.";

    case "forbidden":
      return "GitHub refused the request (status 403).";

    case "unexpected-response":
      return "GitHub sent a response we could not understand. Please try again.";

    default:
      return `Unexpected response from GitHub (status ${error.status}).`;
  }
}
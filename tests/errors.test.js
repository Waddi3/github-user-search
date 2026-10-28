import { ApiError, getErrorMessage } from "../js/errors.js";
import { assert, assertEqual, test } from "./runner.js";

test("ApiError is an Error and an ApiError, and carries its details", () => {
  const error = new ApiError("not-found", { status: 404, username: "xyz" });

  assert(error instanceof Error);
  assert(error instanceof ApiError);
  assertEqual(error.name, "ApiError");
  assertEqual(error.kind, "not-found");
  assertEqual(error.status, 404);
  assertEqual(error.username, "xyz");
});

test("ApiError keeps the original cause", () => {
  const cause = new TypeError("Failed to fetch");
  assertEqual(new ApiError("network", { cause }).cause, cause);
});

test("ApiError can be created without details", () => {
  assertEqual(new ApiError("network").kind, "network");
});

const messageCases = [
  [new ApiError("network"), "Network error. Check your connection and try again."],
  [new ApiError("not-found", { status: 404, username: "xyz" }), 'No GitHub user named "xyz" was found.'],
  [new ApiError("rate-limit", { status: 429 }), "GitHub rate limit reached. Please try again later."],
  [new ApiError("server", { status: 503 }), "GitHub is having problems right now. Please try again later."],
  [new ApiError("forbidden", { status: 403 }), "GitHub refused the request (status 403)."],
  [new ApiError("unexpected-response"), "GitHub sent a response we could not understand. Please try again."],
  [new ApiError("http", { status: 418 }), "Unexpected response from GitHub (status 418)."],
  [new TypeError("a bug of ours"), "Something went wrong. Please try again."],
];

for (const [error, expectedMessage] of messageCases) {
  test(`getErrorMessage for ${error.name} ${error.kind ?? ""} says: ${expectedMessage}`, () => {
    assertEqual(getErrorMessage(error), expectedMessage);
  });
}

test("getErrorMessage for a rate limit includes the reset time when it is known", () => {
  const message = getErrorMessage(new ApiError("rate-limit", { status: 403, resetSeconds: "1791468614" }));

  assert(message.startsWith("GitHub rate limit reached. Try again at "), message);
  assert(message.endsWith("."), message);
});
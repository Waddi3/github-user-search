import { toSafeWebsiteUrl, validateUsername } from "../js/validation.js";
import { assertDeepEqual, assertEqual, test } from "./runner.js";

test("validateUsername accepts a normal username", () => {
  assertDeepEqual(validateUsername("octocat"), { isValid: true, username: "octocat", error: null });
});

test("validateUsername removes spaces around the username", () => {
  assertDeepEqual(validateUsername("  octocat  "), { isValid: true, username: "octocat", error: null });
});

test("validateUsername rejects an empty field", () => {
  assertDeepEqual(validateUsername(""), {
    isValid: false,
    username: "",
    error: "Please enter a GitHub username.",
  });
});

test("validateUsername rejects spaces only", () => {
  assertDeepEqual(validateUsername("    "), {
    isValid: false,
    username: "",
    error: "Please enter a GitHub username.",
  });
});

// Table-driven tests: one table, one test per row
const websiteCases = [
  ["https://example.com", "https://example.com/"],
  ["example.com", "https://example.com/"],
  ["  example.com/blog  ", "https://example.com/blog"],
  ["http://example.com", "http://example.com/"],
  ["HTTPS://Example.COM/Path", "https://example.com/Path"],
  ["javascript:alert(1)", null],
  ["data:text/html,<script>alert(1)</script>", null],
  ["not a url", null],
  ["not a url.com", null],
  ["localhost:3000", null], // a public website always has a dot in its host: a documented decision
  [null, null],
  [undefined, null],
  ["", null],
  ["   ", null],
];

for (const [input, expected] of websiteCases) {
  test(`toSafeWebsiteUrl(${JSON.stringify(input)}) returns ${JSON.stringify(expected)}`, () => {
    assertEqual(toSafeWebsiteUrl(input), expected);
  });
}
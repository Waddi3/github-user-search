import { formatDate, formatNumber, formatResetTime } from "../js/format.js";
import { assert, assertEqual, test } from "./runner.js";

test("formatNumber adds thousands separators", () => {
  assertEqual(formatNumber(1234567), "1,234,567");
});

test("formatNumber keeps a real zero", () => {
  assertEqual(formatNumber(0), "0");
});

test("formatNumber treats missing values as zero", () => {
  assertEqual(formatNumber(null), "0");
  assertEqual(formatNumber(undefined), "0");
});

test("formatDate formats an ISO date like GitHub shows it", () => {
  assertEqual(formatDate("2011-01-25T18:44:36Z"), "January 25, 2011");
});

test("formatDate uses UTC, so the day never depends on the visitor's time zone", () => {
  assertEqual(formatDate("2011-01-25T23:59:59Z"), "January 25, 2011");
  assertEqual(formatDate("2011-01-26T00:00:00Z"), "January 26, 2011");
});

test("formatDate returns null for missing or invalid values", () => {
  assertEqual(formatDate(null), null);
  assertEqual(formatDate(undefined), null);
  assertEqual(formatDate(""), null);
  assertEqual(formatDate("not a date"), null);
});

test("formatResetTime returns null for missing or invalid values", () => {
  assertEqual(formatResetTime(null), null);
  assertEqual(formatResetTime(undefined), null);
  assertEqual(formatResetTime(""), null);
  assertEqual(formatResetTime("abc"), null);
});

test("formatResetTime formats a Unix timestamp (in seconds) as a time", () => {
  // The exact text depends on the visitor's locale and time zone, so we only check its shape
  const result = formatResetTime("1791468614");
  assertEqual(typeof result, "string");
  assert(/\p{Nd}/u.test(result), `Expected a time containing digits but got ${result}`);
});
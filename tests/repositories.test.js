import {
  filterRepositories,
  getRepositoriesNote,
  getRepositoriesSummary,
  sortRepositories,
  sumStars,
} from "../js/repositories.js";
import { assertDeepEqual, assertEqual, test } from "./runner.js";

// A function (not a shared constant) so no test can damage the data of another test
const createSample = () => [
  { name: "Hello-World", description: "My first repository", language: null, stargazers_count: 5, updated_at: "2024-01-01T00:00:00Z" },
  { name: "linguist", description: "Language Savant", language: "Ruby", stargazers_count: 100, updated_at: "2024-03-01T00:00:00Z" },
  { name: "octo-site", description: null, language: "HTML", stargazers_count: 0, updated_at: null },
];

const namesOf = (repos) => repos.map((repo) => repo.name);

// filterRepositories
const filterCases = [
  ["", ["Hello-World", "linguist", "octo-site"]],
  ["   ", ["Hello-World", "linguist", "octo-site"]],
  ["hello", ["Hello-World"]],
  ["RUBY", ["linguist"]],
  ["savant", ["linguist"]],
  ["html", ["octo-site"]],
  ["first", ["Hello-World"]],
  ["zzz", []],
];

for (const [query, expectedNames] of filterCases) {
  test(`filterRepositories with ${JSON.stringify(query)} keeps ${JSON.stringify(expectedNames)}`, () => {
    assertDeepEqual(namesOf(filterRepositories(createSample(), query)), expectedNames);
  });
}

test("filterRepositories does not crash when description and language are null", () => {
  assertDeepEqual(namesOf(filterRepositories(createSample(), "octo")), ["octo-site"]);
});

// sortRepositories
test("sortRepositories by stars puts the most starred first", () => {
  assertDeepEqual(namesOf(sortRepositories(createSample(), "stars")), ["linguist", "Hello-World", "octo-site"]);
});

test("sortRepositories by name is alphabetical", () => {
  assertDeepEqual(namesOf(sortRepositories(createSample(), "name")), ["Hello-World", "linguist", "octo-site"]);
});

test("sortRepositories by updated puts the newest first and missing dates last", () => {
  assertDeepEqual(namesOf(sortRepositories(createSample(), "updated")), ["linguist", "Hello-World", "octo-site"]);
});

test("sortRepositories falls back to the first option for an unknown key", () => {
  assertDeepEqual(namesOf(sortRepositories(createSample(), "nonsense")), ["linguist", "Hello-World", "octo-site"]);
});

test("sortRepositories does NOT change the original array", () => {
  const sample = createSample();

  // Sorting by stars gives a different order than the original, so an in-place sort would be visible
  assertDeepEqual(namesOf(sortRepositories(sample, "stars")), ["linguist", "Hello-World", "octo-site"]);
  assertDeepEqual(namesOf(sample), ["Hello-World", "linguist", "octo-site"]);
});

test("sortRepositories handles an empty list", () => {
  assertDeepEqual(sortRepositories([], "stars"), []);
});

// sumStars
test("sumStars adds the stars of all repositories", () => {
  assertEqual(sumStars(createSample()), 105);
});

test("sumStars of an empty list is 0 (the reduce start value)", () => {
  assertEqual(sumStars([]), 0);
});

test("sumStars treats missing star counts as 0", () => {
  assertEqual(sumStars([{}, { stargazers_count: 3 }]), 3);
});

// getRepositoriesSummary
test("getRepositoriesSummary describes what the list shows", () => {
  assertEqual(getRepositoriesSummary(3, 8, 1234), "3 of 8 repositories · 1,234 stars");
});

// getRepositoriesNote
const noteCases = [
  [0, 0, "This user has no public repositories."],
  [8, 8, null],
  [100, 2500, "Showing 100 of 2,500 repositories."],
  [8, undefined, null],
  [30, 12, null],
];

for (const [shown, total, expected] of noteCases) {
  test(`getRepositoriesNote(${shown}, ${total}) returns ${JSON.stringify(expected)}`, () => {
    assertEqual(getRepositoriesNote(shown, total), expected);
  });
}
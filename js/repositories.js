// Repository list logic: filtering, sorting and summaries. Pure functions, no DOM.
import { formatNumber } from "./format.js";
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
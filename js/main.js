import {
  APP_NAME,
  filterRepositories,
  getRepositoriesNote,
  getRepositoriesSummary,
  sortRepositories,
  sumStars,
  validateUsername,
} from "./utils.js";
import {
  clearFieldError,
  hideResults,
  onRepositoryControlsChange,
  onSearchSubmit,
  readRepositoryControls,
  renderProfile,
  renderRepositories,
  resetRepositoryControls,
  setStatus,
  showFieldError,
  showRepositoriesMessage,
} from "./ui.js";
import { getRepos, getUser } from "./api.js";

console.log(`${APP_NAME}: main.js loaded`);

// State: the data behind the repository list
let allRepos = [];
let publicRepoCount; // the total GitHub reports (user.public_repos)

/**
 * Recomputes what the repository list shows from the state and the controls.
 * @param {{ query: string, sortKey: string }} controls
 */
function refreshRepositories({ query, sortKey }) {
  const visibleRepos = sortRepositories(filterRepositories(allRepos, query), sortKey);
  const showControls = allRepos.length > 1; // nothing to filter or sort with 0 or 1 repository

  renderRepositories({
    repos: visibleRepos,
    summary: showControls
      ? getRepositoriesSummary(visibleRepos.length, allRepos.length, sumStars(visibleRepos))
      : "",
    note: getRepositoriesNote(allRepos.length, publicRepoCount),
    showControls,
  });
}

onRepositoryControlsChange(refreshRepositories);

/**
 * Runs one search: validates the input, loads the data and renders it.
 * @param {string} rawValue - exactly what the user typed
 */
async function handleSearch(rawValue) {
  clearFieldError();
  setStatus("");
  hideResults();
  allRepos = [];

  const { isValid, username, error: validationError } = validateUsername(rawValue);

  if (!isValid) {
    showFieldError(validationError);
    return;
  }

  setLoading(true);
  setStatus(`Searching GitHub for "${username}"...`);

  try {
    // Both requests start now and run in parallel; allSettled never rejects
    const [userOutcome, reposOutcome] = await Promise.allSettled([
      getUser(username),
      getRepos(username),
    ]);

    if (userOutcome.status === "rejected") {
      setStatus(userOutcome.reason.message);
      return;
    }

    const user = userOutcome.value;
    renderProfile(user);
    setStatus(`Showing profile for ${user.login}`);

    if (reposOutcome.status === "rejected") {
      showRepositoriesMessage(reposOutcome.reason.message);
      return;
    }

    allRepos = reposOutcome.value;
    publicRepoCount = user.public_repos;
    resetRepositoryControls();
    refreshRepositories(readRepositoryControls());
  } finally {
    // Runs on every exit path: success, error message, early return, or exception
    setLoading(false);
  }
}

onSearchSubmit(handleSearch);
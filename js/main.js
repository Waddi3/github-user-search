import {
  APP_NAME,
  validateUsername,
} from "./utils.js";
import {
  filterRepositories,
  getRepositoriesNote,
  getRepositoriesSummary,
  sortRepositories,
  sumStars,
} from "./repositories.js";
import {
  clearFieldError,
  hideResults,
  onRepositoryControlsChange,
  onSearchSubmit,
  readRepositoryControls,
  renderProfile,
  renderRepositories,
  resetRepositoryControls,
  setLoading,
  setStatus,
  showFieldError,
  showRepositoriesMessage,
} from "./ui.js";
import { getRepos, getUser } from "./api.js";
import { ApiError, getErrorMessage } from "./errors.js";

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

let latestSearchId = 0;   // number of the most recent search (shared by all calls)

/**
 * Returns the message to show for a failure, and logs the ones that are our own bugs.
 * @param {unknown} error
 * @returns {string}
 */
function describeFailure(error) {
  if (!(error instanceof ApiError)) {
    // Unexpected: keep the details for us, show something generic to the user
    console.error(error);
  }

  return getErrorMessage(error);
}

/**
 * Runs one search: validates the input, loads the data and renders it.
 * @param {string} rawValue - exactly what the user typed
 */
async function handleSearch(rawValue) {
  console.log("handleSearch called with:", rawValue);
  const searchId = ++latestSearchId;   // 1. take the next number: this search's own id
  clearFieldError();
  setStatus("");
  hideResults();
  setLoading(false);      // a new submit always starts from the idle state
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

    if (latestSearchId !== searchId) {            // 2. another search started while we were waiting
      return;
    }

    if (userOutcome.status === "rejected") {
      setStatus(describeFailure(userOutcome.reason));
      return;
    }

    const user = userOutcome.value;
    renderProfile(user);
    setStatus(`Showing profile for ${user.login}`);

    if (reposOutcome.status === "rejected") {
      showRepositoriesMessage(describeFailure(reposOutcome.reason));
      return;
    }

    allRepos = reposOutcome.value;
    publicRepoCount = user.public_repos;
    resetRepositoryControls();
    refreshRepositories(readRepositoryControls());

    } catch (error) {
    // Something unexpected threw inside our own code
    if (latestSearchId === searchId) {
      setStatus(describeFailure(error));
    }

  } finally {
    // Runs on every exit path: success, error message, early return, or exception
    if (latestSearchId === searchId) {            // 3. only the latest search may end the loading state
      setLoading(false);
    }
  }
}

onSearchSubmit(handleSearch);
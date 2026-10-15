import { APP_NAME, validateUsername } from "./utils.js";
import {
  onSearchSubmit,
  setStatus,
  showFieldError,
  clearFieldError,
  renderProfile,
  renderRepositories,
  showRepositoriesMessage,
  hideResults,
} from "./ui.js";
import { getUser, getRepos } from "./api.js";

console.log(`${APP_NAME}: main.js loaded`);

onSearchSubmit(async (rawValue) => {
  clearFieldError();
  setStatus("");
  hideResults();

  const { isValid, username, error: validationError } = validateUsername(rawValue);

  if (!isValid) {
    showFieldError(validationError);
    return;
  }

  setStatus(`Searching GitHub for "${username}"...`);

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

  if (reposOutcome.status === "fulfilled") {
    renderRepositories(reposOutcome.value, user.public_repos);
  } else {
    showRepositoriesMessage(reposOutcome.reason.message);
  }
});
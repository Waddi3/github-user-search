import { APP_NAME, validateUsername } from "./utils.js";
import { onSearchSubmit, setStatus, showFieldError, clearFieldError } from "./ui.js";

console.log(`${APP_NAME}: main.js loaded`);

onSearchSubmit((rawValue) => {
  clearFieldError();
  setStatus("");

  const { isValid, username, error } = validateUsername(rawValue);

  if (!isValid) {
    showFieldError(error);
    return;
  }

  // Placeholder: Phase 6 will call the GitHub API here.
  setStatus(`Ready to search for "${username}"`);
});
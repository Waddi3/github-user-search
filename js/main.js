import { APP_NAME, validateUsername } from "./utils.js";
import {
  onSearchSubmit,
  setStatus,
  showFieldError,
  clearFieldError,
  renderProfile,
  hideProfile,
} from "./ui.js";
import { getUser } from "./api.js";

console.log(`${APP_NAME}: main.js loaded`);

onSearchSubmit(async (rawValue) => {
  clearFieldError();
  setStatus("");
  hideProfile();

  const { isValid, username, error: validationError } = validateUsername(rawValue);

  if (!isValid) {
    showFieldError(validationError);
    return;
  }

  setStatus(`Searching GitHub for "${username}"...`);

  try {
    const user = await getUser(username);
    renderProfile(user);
    setStatus(`Showing profile for ${user.login}`);
  } catch (error) {
    setStatus(error.message);
  }
});
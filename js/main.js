import { APP_NAME, validateUsername } from "./utils.js";
import { onSearchSubmit, setStatus, showFieldError, clearFieldError } from "./ui.js";
import { getUser } from "./api.js";

console.log(`${APP_NAME}: main.js loaded`);

onSearchSubmit(async (rawValue) => {
  clearFieldError();
  setStatus("");

  const { isValid, username, error: validationError } = validateUsername(rawValue);

  if (!isValid) {
    showFieldError(validationError);
    return;
  }

  setStatus(`Searching GitHub for "${username}"...`);

  try {
    const user = await getUser(username);
    console.log(user); // Phase 8 will render the profile
    setStatus(`Found ${user.login}`);
  } catch (error) {
    setStatus(error.message);
  }
});
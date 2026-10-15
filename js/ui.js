// UI layer: the only module that touches the DOM.
import { formatDate, formatNumber, toSafeWebsiteUrl } from "./utils.js";
/**
 * Finds an element by id, or fails immediately with a clear message.
 * @param {string} id
 * @returns {HTMLElement}
 */
function getRequiredElement(id) {
  const element = document.getElementById(id);

  if (element === null) {
    throw new Error(`Missing element with id "${id}" in index.html`);
  }

  return element;
}

// Looked up once, when this module is first loaded, then reused.
const elements = {
  form: getRequiredElement("search-form"),
  input: getRequiredElement("username-input"),
  fieldError: getRequiredElement("username-error"),
  status: getRequiredElement("status"),
  profile: getRequiredElement("profile"),
  avatar: getRequiredElement("profile-avatar"),
  name: getRequiredElement("profile-name"),
  link: getRequiredElement("profile-link"),
  bio: getRequiredElement("profile-bio"),
  followers: getRequiredElement("profile-followers"),
  following: getRequiredElement("profile-following"),
  repos: getRequiredElement("profile-repos"),
  location: getRequiredElement("profile-location"),
  company: getRequiredElement("profile-company"),
  website: getRequiredElement("profile-website"),
  joined: getRequiredElement("profile-joined"),
};

/**
 * Writes a message into the status live region. Pass "" to clear it.
 * @param {string} message
 */
export function setStatus(message) {
  elements.status.textContent = message;
}

/**
 * Shows a validation message under the input and marks the input invalid.
 * @param {string} message
 */
export function showFieldError(message) {
  elements.fieldError.textContent = message;
  elements.fieldError.hidden = false;
  elements.input.setAttribute("aria-invalid", "true");
  elements.input.focus(); // move the cursor back to the field that needs fixing
}

/**
 * Removes the validation message and the invalid mark.
 */
export function clearFieldError() {
  elements.fieldError.textContent = "";
  elements.fieldError.hidden = true;
  elements.input.removeAttribute("aria-invalid");
}

/**
 * hide the element when there is nothing meaningful to show.
 */
export function setOptionalText(element, value) {
  const cleaned = value?.trim();

  if (cleaned) {
    element.textContent = cleaned;
    element.hidden = false;
  } else {
    element.textContent = "";
    element.hidden = true;
  }
}

/**
 * Fills the profile card with the data of one GitHub user and shows it.
 * @param {object} user - the object returned by getUser
 */
export function renderProfile(user) {
  const avatar = document.createElement("img");
  avatar.src = user.avatar_url;
  avatar.alt = `${user.login}'s avatar`;
  elements.avatar.replaceChildren(avatar);

  elements.name.textContent = user.name || user.login;
  elements.link.textContent = `@${user.login}`;
  elements.link.href = user.html_url;
  setOptionalText(elements.bio, user.bio);

  elements.followers.textContent = formatNumber(user.followers);
  elements.following.textContent = formatNumber(user.following);
  elements.repos.textContent = formatNumber(user.public_repos);

  setOptionalText(elements.location, user.location);
  setOptionalText(elements.company, user.company);

  const websiteUrl = toSafeWebsiteUrl(user.blog);
  const websiteLink = elements.website.querySelector("a");
  if (websiteUrl) {
    websiteLink.href = websiteUrl;
    websiteLink.textContent = websiteUrl;
    elements.website.hidden = false;
  } else {
    elements.website.hidden = true;
  }

  const joinDate = formatDate(user.created_at);
  setOptionalText(elements.joined, joinDate ? `Joined ${joinDate}` : null);

  elements.profile.hidden = false;
}

/**
 * Hides the profile card.
 */
export function hideProfile() {
  elements.profile.hidden = true;
}
 

/**
 * Calls `handler` with the raw input text whenever the search form is submitted.
 * @param {(rawValue: string) => void | Promise<void>} handler
*/
export function onSearchSubmit(handler) {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    handler(elements.input.value);
  });
}


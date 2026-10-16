// UI layer: the only module that touches the DOM.
import { formatDate, formatNumber, SORT_OPTIONS, toSafeWebsiteUrl } from "./utils.js";
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
  repositories: getRequiredElement("repositories"),
  repositoriesNote: getRequiredElement("repositories-note"),
  repositoryList: getRequiredElement("repository-list"),
  repositoryTemplate: getRequiredElement("repository-template"),
  repositoryControls: getRequiredElement("repository-controls"),
  repositoryFilter: getRequiredElement("repository-filter"),
  repositorySort: getRequiredElement("repository-sort"),
  repositoriesSummary: getRequiredElement("repositories-summary"),
};

// The sort choices are built from the data, so labels and keys live in one place
elements.repositorySort.replaceChildren(
  ...SORT_OPTIONS.map((option) => new Option(option.label, option.key))
);

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
export function hideResults() {
  elements.profile.hidden = true;
  elements.repositories.hidden = true;

}
 
/**
 * Builds one repository row from the HTML template.
 * @param {object} repo
 * @returns {DocumentFragment}
 */
function createRepositoryItem(repo) {
  const row = elements.repositoryTemplate.content.cloneNode(true);

  const link = row.querySelector(".repo__name a");
  link.textContent = repo.name;
  link.href = repo.html_url;

  setOptionalText(row.querySelector(".repo__description"), repo.description);
  setOptionalText(row.querySelector(".repo__language"), repo.language);

  row.querySelector(".repo__stars").textContent = `Stars: ${formatNumber(repo.stargazers_count)}`;
  row.querySelector(".repo__forks").textContent = `Forks: ${formatNumber(repo.forks_count)}`;

  const updated = formatDate(repo.updated_at);
  setOptionalText(row.querySelector(".repo__updated"), updated ? `Updated: ${updated}` : null);

  return row;
}

/**
 * Reads the current state of the repository controls.
 * @returns {{ query: string, sortKey: string }}
 */
export function readRepositoryControls() {
  return {
    query: elements.repositoryFilter.value,
    sortKey: elements.repositorySort.value,
  };
}

/**
 * Clears the filter and selects the default sort.
 */
export function resetRepositoryControls() {
  elements.repositoryFilter.value = "";
  elements.repositorySort.value = SORT_OPTIONS[0].key;
}

/**
 * Calls `handler` with the current controls whenever the filter or sort changes.
 * @param {(controls: { query: string, sortKey: string }) => void} handler
 */
export function onRepositoryControlsChange(handler) {
  const notify = () => handler(readRepositoryControls());

  elements.repositoryFilter.addEventListener("input", notify);
  elements.repositorySort.addEventListener("change", notify);
}

/**
 * Shows a list of repositories with its summary and note.
 * @param {object} options
 * @param {object[]} options.repos - repositories to display
 * @param {string} options.summary - one-line description of the list ("" for none)
 * @param {string | null} options.note - extra note above the list, or null
 * @param {boolean} options.showControls - show the filter and sort controls
 */
export function renderRepositories({ repos, summary, note, showControls }) {
  const rows = repos.map(createRepositoryItem);
  elements.repositoryList.replaceChildren(...rows);

  elements.repositoriesSummary.textContent = summary;
  setOptionalText(elements.repositoriesNote, note);
  elements.repositoryControls.hidden = !showControls;
  elements.repositories.hidden = false;
}

/**
 * Shows a message instead of the repository list.
 * @param {string} message
 */
export function showRepositoriesMessage(message) {
  elements.repositoryList.replaceChildren();
  elements.repositoriesSummary.textContent = "";
  elements.repositoryControls.hidden = true;
  setOptionalText(elements.repositoriesNote, message);
  elements.repositories.hidden = false;
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

/**
 * Switches the page between the idle and the loading state.
 * @param {boolean} isLoading
 */
export function setLoading(isLoading) {
  if (isLoading) {
    elements.form.setAttribute("aria-busy", "true");
  } else {
    elements.form.removeAttribute("aria-busy");
  }
}
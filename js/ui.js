// UI layer: the only module that touches the DOM.

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
 * Calls `handler` with the raw input text whenever the search form is submitted.
 * @param {(rawValue: string) => void} handler
 */
export function onSearchSubmit(handler) {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    handler(elements.input.value);
  });
}
 
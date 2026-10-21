// Shared helper functions (pure, no DOM, no network).
export const APP_NAME = "GitHub User Search";
export function validateUsername(rawValue) {
  const username = rawValue.trim();   

  if (!username) {              
    return { isValid: false, username, error: "Please enter a GitHub username." };
  }

  return { isValid: true, username, error: null };
}
/**
 * Turns the "blog" field typed by a user into a URL that is safe to use in a link.
 * Returns null when the value is missing, invalid, or not an http(s) address.
 * @param {string | null | undefined} rawValue
 * @returns {string | null}
 */
export function toSafeWebsiteUrl(rawValue) {
  const value = rawValue?.trim();

  if (!value) {
    return null;
  }

  const lower = value.toLowerCase();
  const withProtocol =
    lower.startsWith("http://") || lower.startsWith("https://")
      ? value
      : `https://${value}`;

  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  return url.href;
}













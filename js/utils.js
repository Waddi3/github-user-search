// Shared helper functions (pure, no DOM, no network).
export const APP_NAME = "GitHub User Search";
export function validateUsername(rawValue) {
  const username = rawValue.trim();   

  if (!username) {              
    return { isValid: false, username, error: "Please enter a GitHub username." };
  }

  return { isValid: true, username, error: null };
}
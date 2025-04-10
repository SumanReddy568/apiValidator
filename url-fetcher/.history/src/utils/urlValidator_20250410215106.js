import { settings } from "../config/settings.js";

export function isValidUrlFormat(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function isValidUrl(url) {
  if (!isValidUrlFormat(url)) {
    return false;
  }

  // Check excluded extensions
  if (settings.excludedExtensions.some((ext) => url.endsWith(ext))) {
    return false;
  }

  // Check excluded paths
  if (settings.excludedPaths.some((path) => url.includes(path))) {
    return false;
  }

  // Check URL patterns
  if (settings.urlPatterns) {
    if (
      settings.urlPatterns.include &&
      !settings.urlPatterns.include.some((pattern) => pattern.test(url))
    ) {
      return false;
    }
    if (
      settings.urlPatterns.exclude &&
      settings.urlPatterns.exclude.some((pattern) => pattern.test(url))
    ) {
      return false;
    }
  }

  return true;
}

import fetch from "node-fetch";
import { logger } from "./logger.js";
import { settings } from "../config/settings.js";

export async function isValidUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), settings.timeout);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: settings.headers,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    logger.debug(`URL validation failed for ${url}:`, error.message);
    return false;
  }
}

export function isValidUrlFormat(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

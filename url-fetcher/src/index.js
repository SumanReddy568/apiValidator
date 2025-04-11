import { getValidUrls } from "./utils/urlExtractor.js";
import { logger } from "./utils/logger.js";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// Enhanced fetcher with retry capability
async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add randomized delay between retries to avoid detection
      if (attempt > 0) {
        const retryDelay = Math.floor(Math.random() * 1000) + 500;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }

      // Create a controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || 10000
      );

      // Add signal to options
      const fetchOptions = {
        ...options,
        signal: controller.signal,
      };

      // Execute fetch
      const response = await fetch(url, fetchOptions);

      // Clear timeout
      clearTimeout(timeoutId);

      return response;
    } catch (error) {
      lastError = error;
      logger.debug(
        `Attempt ${attempt + 1}/${maxRetries + 1} failed for ${url}: ${
          error.message
        }`
      );
    }
  }

  throw lastError;
}

/**
 * Main function to fetch unique URLs
 * @param {number} [count] - Number of URLs to fetch (optional)
 * @returns {Promise<string[]>} Array of URLs
 */
export async function fetchUrls(count) {
  try {
    const enhancedFetch = (url, options) => fetchWithRetry(url, options);
    const urls = await getValidUrls(enhancedFetch, JSDOM, count);
    return urls;
  } catch (error) {
    logger.error("Error fetching URLs:", error);
    throw error;
  }
}

// Default export
export default fetchUrls;

// CLI support
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const count = parseInt(process.argv[2]) || undefined;
  fetchUrls(count)
    .then(urls => console.log(JSON.stringify(urls, null, 2)))
    .catch(error => {
      console.error("Error:", error);
      process.exit(1);
    });
}

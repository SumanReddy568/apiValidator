import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { isValidUrl, isValidUrlFormat } from "./urlValidator.js";
import { logger } from "./logger.js";
import { settings } from "../config/settings.js";

export async function getValidUrls(numUrls = settings.numberOfUrls) {
  const validUrls = new Set();
  const visited = new Set();

  async function extractUrlsFromPage(url) {
    try {
      const response = await fetch(url, {
        headers: settings.headers,
        timeout: settings.timeout,
      });
      const html = await response.text();
      const dom = new JSDOM(html);
      const links = Array.from(dom.window.document.querySelectorAll("a"))
        .map((link) => {
          try {
            return new URL(link.href, url).toString();
          } catch {
            return null;
          }
        })
        .filter(
          (link) =>
            link &&
            link.startsWith("http") &&
            !settings.excludedDomains.some((domain) => link.includes(domain))
        );

      return [...new Set(links)];
    } catch (error) {
      logger.debug(`Failed to extract URLs from ${url}:`, error.message);
      return [];
    }
  }

  async function crawl(startUrl) {
    if (validUrls.size >= numUrls || visited.has(startUrl)) {
      return;
    }

    visited.add(startUrl);

    if (await isValidUrl(startUrl)) {
      validUrls.add(startUrl);
      logger.info(`Found valid URL (${validUrls.size}/${numUrls}):`, startUrl);

      if (validUrls.size < numUrls) {
        const newUrls = await extractUrlsFromPage(startUrl);
        for (const url of newUrls) {
          if (!visited.has(url) && validUrls.size < numUrls) {
            // Add delay to be respectful to servers
            await new Promise((resolve) =>
              setTimeout(resolve, settings.crawlDelay)
            );
            await crawl(url);
          }
        }
      }
    }
  }

  const crawlPromises = settings.seedUrls.map((url) => crawl(url));
  await Promise.all(crawlPromises);

  return Array.from(validUrls).slice(0, numUrls);
}

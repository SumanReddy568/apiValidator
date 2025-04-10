import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { isValidUrl, isValidUrlFormat } from "./urlValidator.js";
import { logger } from "./logger.js";
import { settings } from "../config/settings.js";

export async function getValidUrls(numUrls = settings.numberOfUrls) {
  const validUrls = new Set();
  const visited = new Set();
  const domains = new Set();

  // Function to extract domain from URL
  function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  // Add this function at the top of the file
  function isNewDomain(url, existingUrls) {
    const domain = getDomain(url);
    return !Array.from(existingUrls).some(
      (existing) => getDomain(existing) === domain
    );
  }

  async function extractUrlsFromPage(url) {
    try {
      const response = await fetch(url, {
        headers: {
          ...settings.headers,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; URL-Fetcher/1.0;)",
        },
        timeout: 5000, // reduced timeout for faster extraction
        redirect: "follow",
        follow: 3, // reduced redirects for speed
      });

      if (
        !response.ok ||
        !settings.allowedContentTypes.includes(
          response.headers.get("content-type")?.split(";")[0]
        )
      ) {
        return [];
      }

      const html = await response.text();
      const dom = new JSDOM(html);
      return [
        ...new Set([
          ...Array.from(dom.window.document.querySelectorAll("a[href]")),
          ...Array.from(dom.window.document.querySelectorAll("link[href]")),
        ]),
      ]
        .map((link) => {
          try {
            return new URL(link.href, url).toString();
          } catch {
            return null;
          }
        })
        .filter((link) => link && isValidUrl(link)); // Use isValidUrl here
    } catch (error) {
      logger.debug(`Failed to extract URLs from ${url}:`, error.message);
      return [];
    }
  }

  // Rate limiting map
  const domainLastAccessed = new Map();

  async function crawl(startUrl) {
    if (validUrls.size >= numUrls || visited.has(startUrl)) {
      return;
    }

    const domain = getDomain(startUrl);
    const now = Date.now();
    const lastAccessed = domainLastAccessed.get(domain) || 0;

    if (now - lastAccessed < settings.crawlDelay) {
      // Use crawlDelay from settings
      await new Promise((resolve) => setTimeout(resolve, settings.crawlDelay));
    }
    domainLastAccessed.set(domain, now);

    visited.add(startUrl);

    if (await isValidUrl(startUrl)) {
      if (isNewDomain(startUrl, validUrls)) {
        validUrls.add(startUrl);
        domains.add(domain);
        logger.info(`Found new domain: ${domain}`);
      } else if (validUrls.size < numUrls) {
        const urlsFromDomain = Array.from(validUrls).filter(
          (url) => getDomain(url) === domain
        ).length;
        if (urlsFromDomain < settings.maxUrlsPerDomain) {
          validUrls.add(startUrl);
        }
      }

      if (validUrls.size < numUrls) {
        const newUrls = await extractUrlsFromPage(startUrl);
        const prioritizedUrls = newUrls
          .filter((url) => !visited.has(url))
          .sort(() => Math.random() - 0.5)
          .slice(0, 10); // Limit URLs per page for faster processing

        await Promise.all(prioritizedUrls.map((url) => crawl(url)));
      }
    }
  }

  const diverseSeedUrls = [
    "https://www.wikipedia.org",
    "https://news.ycombinator.com",
    "https://reddit.com",
    "https://github.com/trending",
    "https://medium.com/topic/technology",
    "https://dev.to",
    "https://stackoverflow.com",
    "https://producthunt.com",
    "https://techcrunch.com",
    "https://news.google.com",
    "https://www.theguardian.com/technology",
    "https://www.bbc.com/news/technology",
    "https://www.reuters.com/technology",
    "https://www.cnet.com",
    ...settings.seedUrls,
  ];

  // Process in parallel with higher concurrency
  const concurrencyLimit = 10;
  const shuffledSeeds = diverseSeedUrls.sort(() => Math.random() - 0.5);

  await Promise.all(
    shuffledSeeds.slice(0, concurrencyLimit).map((url) => crawl(url))
  );

  return Array.from(validUrls).slice(0, numUrls);
}

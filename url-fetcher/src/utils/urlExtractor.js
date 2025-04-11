import {
  isValidUrl,
  isValidUrlFormat,
  normalizeUrl,
  isWorthCrawling,
} from "./urlValidator.js";
import { logger } from "./logger.js";
import { settings } from "../config/settings.js";
import fs from "fs";
import path from "path";
import os from "os"; // Use ES module import for "os"

// File to persist previously extracted domains
const hiddenDir = path.join(os.homedir(), ".url-fetcher"); 
const extractedDomainsFile = path.join(hiddenDir, "extractedDomains.json");

// Ensure the hidden directory exists
function ensureStorageDirectory() {
  if (!fs.existsSync(hiddenDir)) {
    fs.mkdirSync(hiddenDir, { recursive: true });
  }
}

// Load previously extracted domains
let previouslyExtractedDomains = new Set();
function loadExtractedDomains() {
  ensureStorageDirectory();
  if (fs.existsSync(extractedDomainsFile)) {
    previouslyExtractedDomains = new Set(
      JSON.parse(fs.readFileSync(extractedDomainsFile, "utf-8"))
    );
  }
  return previouslyExtractedDomains;
}

// Save extracted domains to file
function saveExtractedDomains(domains) {
  ensureStorageDirectory();
  const allDomains = new Set([...loadExtractedDomains(), ...domains]);
  fs.writeFileSync(
    extractedDomainsFile,
    JSON.stringify(Array.from(allDomains), null, 2)
  );
  previouslyExtractedDomains = allDomains; // Update in-memory set
}

// Utility to generate random delay
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Get random referer from our valid URLs or seed URLs
function getRandomReferer(validUrls) {
  const refererPool = [...Array.from(validUrls), ...settings.seedUrls];
  const randomIndex = Math.floor(Math.random() * refererPool.length);
  return refererPool[randomIndex] || "https://www.google.com/";
}

// Extract domain from URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// Add new utility functions at the top
const processedDomains = new Set();
const domainUrlCounts = new Map();
const domainPriorities = new Map();

function shouldSwitchDomain(domain) {
  const urlCount = domainUrlCounts.get(domain) || 0;
  return urlCount >= Math.min(5, settings.maxUrlsPerDomain / 2);
}

function updateDomainScore(domain, success) {
  let priority = domainPriorities.get(domain) || 1.0;
  priority = success ? priority * 1.2 : priority * 0.8;
  domainPriorities.set(domain, priority);
  return priority;
}

// Fetch domains without duplicates
export async function fetchDomains(domainProvider) {
  const fetchedDomains = loadExtractedDomains();
  const newDomains = await domainProvider(); // Assume this function provides new domains

  const uniqueDomains = newDomains.filter(
    (domain) => !fetchedDomains.has(domain)
  );
  saveExtractedDomains(uniqueDomains);
  return uniqueDomains;
}

// Main URL extraction function
export async function getValidUrls(
  customFetch,
  customJSDOM,
  numUrls = settings.numberOfUrls
) {
  const validUrls = new Set();
  const visited = new Set();
  const domains = new Set();
  const urlQueue = [];
  const domainLastAccessed = new Map();

  // Add new Set for tracking current batch domains
  const currentBatchDomains = new Set();

  // Modified enqueueUrls function
  function enqueueUrls(urls, priority = 0, currentDepth = 0) {
    if (!Array.isArray(urls)) return;

    const domainGroups = new Map();

    for (const url of urls) {
      const domain = getDomain(url);
      if (!domain || previouslyExtractedDomains.has(domain)) continue;

      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain).push(url);
    }

    for (const [domain, domainUrls] of domainGroups) {
      const selectedUrls = domainUrls
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      for (const url of selectedUrls) {
        const urlPriority = priority + Math.random() * 5;

        urlQueue.push({
          url,
          priority: urlPriority,
          depth: currentDepth,
          domain,
        });
      }
    }

    urlQueue.sort((a, b) => b.priority - a.priority);
  }

  // Extract sitemap URLs from a website
  async function extractSitemapUrls(domain) {
    if (!settings.enableSitemapDiscovery) return [];

    try {
      const sitemapUrl = `https://${domain}/sitemap.xml`;
      const response = await customFetch(sitemapUrl, {
        headers: settings.headers,
        timeout: settings.timeout,
      });

      if (!response.ok) return [];

      const content = await response.text();
      const dom = new customJSDOM(content);
      const locs = dom.window.document.querySelectorAll("loc");

      return Array.from(locs)
        .map((loc) => loc.textContent)
        .filter(isValidUrlFormat);
    } catch (error) {
      return [];
    }
  }

  // Extract URLs from robots.txt
  async function extractRobotsTxtUrls(domain) {
    if (!settings.checkRobotsTxt) return [];

    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await customFetch(robotsUrl, {
        headers: settings.headers,
        timeout: settings.timeout / 2,
      });

      if (!response.ok) return [];

      const content = await response.text();
      const sitemapMatches = content.match(/Sitemap:\s*(.+)/gi);

      if (!sitemapMatches) return [];

      return sitemapMatches
        .map((match) => {
          const url = match.replace(/Sitemap:\s*/i, "").trim();
          return url;
        })
        .filter(isValidUrlFormat);
    } catch (error) {
      return [];
    }
  }

  // Enhanced URL extraction with better link finding
  async function extractUrlsFromPage(url, depth = 0) {
    if (depth > settings.maxDepth) return [];

    try {
      const headers = { ...settings.headers };

      // Use random referer to appear more natural
      if (settings.useRandomReferer && validUrls.size > 0) {
        headers["Referer"] = getRandomReferer(validUrls);
      }

      const response = await customFetch(url, {
        headers,
        timeout: settings.timeout,
        redirect: "follow",
        follow: settings.maxRedirects || 3,
      });

      if (!response.ok) return [];

      const contentType = response.headers.get("content-type");
      if (
        !contentType ||
        !settings.allowedContentTypes.some((type) =>
          contentType.toLowerCase().includes(type.toLowerCase())
        )
      ) {
        return [];
      }

      const html = await response.text();

      // Very basic check for content size
      if (html.length < settings.minContentLength) {
        return [];
      }

      const dom = new customJSDOM(html);
      const document = dom.window.document;

      // Skip pages with captchas, logins, or minimal content
      const textContent = document.body ? document.body.textContent : "";
      if (
        textContent.includes("captcha") ||
        (textContent.includes("robot") && textContent.includes("check")) ||
        document.querySelectorAll('input[type="password"]').length > 0
      ) {
        return [];
      }

      // Check text to HTML ratio
      const textRatio = textContent.length / html.length;
      if (textRatio < settings.minTextContentRatio) {
        return [];
      }

      // Collect URLs from various sources
      const foundUrls = new Set();

      // 1. Standard links
      const links = document.querySelectorAll("a[href]");
      links.forEach((link) => {
        try {
          const href = link.getAttribute("href");
          if (!href) return;

          // Skip same-page anchors
          if (href.startsWith("#")) return;

          const absoluteUrl = new URL(href, url).toString();
          foundUrls.add(absoluteUrl);
        } catch {}
      });

      // 2. Check canonical links
      const canonicals = document.querySelectorAll('link[rel="canonical"]');
      canonicals.forEach((link) => {
        try {
          const href = link.getAttribute("href");
          if (href) {
            const absoluteUrl = new URL(href, url).toString();
            foundUrls.add(absoluteUrl);
          }
        } catch {}
      });

      // 3. Alternate links
      const alternates = document.querySelectorAll('link[rel="alternate"]');
      alternates.forEach((link) => {
        try {
          const href = link.getAttribute("href");
          if (href) {
            const absoluteUrl = new URL(href, url).toString();
            foundUrls.add(absoluteUrl);
          }
        } catch {}
      });

      // 4. Look for links in content (sometimes JavaScript-rendered content has URLs in text)
      const textNodes = Array.from(
        document.querySelectorAll("p, span, div")
      ).map((el) => el.textContent);

      const urlRegex = /(https?:\/\/[^\s"'>]+)/g;
      textNodes.forEach((text) => {
        const matches = text.match(urlRegex);
        if (matches) {
          matches.forEach((match) => foundUrls.add(match));
        }
      });

      // Filter and return valid URLs
      return Array.from(foundUrls).filter(isValidUrlFormat);
    } catch (error) {
      logger.debug(`Failed to extract URLs from ${url}:`, error.message);
      return [];
    }
  }

  // Modified crawl function
  async function crawl(queueItem) {
    const { url, depth, domain } = queueItem;

    if (validUrls.size >= numUrls || visited.has(url)) return;

    // Skip if domain is overused
    if (shouldSwitchDomain(domain)) {
      processedDomains.add(domain);
      return;
    }

    visited.add(url);
    currentBatchDomains.add(domain);

    // Update domain URL count
    domainUrlCounts.set(domain, (domainUrlCounts.get(domain) || 0) + 1);

    // Respect crawl delay with some randomness
    if (domain) {
      const now = Date.now();
      const lastAccessed = domainLastAccessed.get(domain) || 0;
      const delay = settings.crawlDelay + randomDelay(0, 300);

      if (now - lastAccessed < delay) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      domainLastAccessed.set(domain, Date.now());
    }

    // Process the URL
    try {
      if (await isValidUrl(url)) {
        validUrls.add(url);
        domains.add(domain);
        updateDomainScore(domain, true);

        // Aggressive domain switching
        if (shouldSwitchDomain(domain)) {
          processedDomains.add(domain);
          return;
        }

        if (validUrls.size < numUrls && depth < settings.maxDepth) {
          const newUrls = await extractUrlsFromPage(url, depth);
          const worthCrawling = newUrls.filter(
            (newUrl) =>
              !previouslyExtractedDomains.has(getDomain(newUrl)) &&
              !visited.has(newUrl) &&
              isValidUrlFormat(newUrl)
          );

          enqueueUrls(worthCrawling, 10 - depth, depth + 1);
        }
      } else {
        updateDomainScore(domain, false);
      }
    } catch (error) {
      // Suppress errors and log internally
      logger.debug(`Error processing URL ${url}: ${error.message}`);
    }
  }

  // Use Promise.all with limited concurrency
  const runningPromises = new Set();

  // Function to process the queue with limited concurrency
  async function processQueue() {
    const processStart = Date.now();

    while (
      urlQueue.length > 0 &&
      validUrls.size < numUrls &&
      Date.now() - processStart < settings.timeout * 2
    ) {
      // Respect concurrency limit
      if (runningPromises.size >= settings.concurrentRequests) {
        await Promise.race(runningPromises);
      }

      // Get next URL from queue
      const queueItem = urlQueue.shift();

      // Skip if already visited
      if (visited.has(queueItem.url)) {
        continue;
      }

      // Process URL
      const promise = crawl(queueItem).finally(() => {
        runningPromises.delete(promise);
      });

      runningPromises.add(promise);
    }

    // Wait for remaining promises
    await Promise.all(runningPromises);
  }

  // Initialize with shuffled seed URLs
  const shuffledSeedUrls = settings.seedUrls.sort(() => Math.random() - 0.5);
  enqueueUrls(shuffledSeedUrls, 10, 0);

  // Process the queue
  await processQueue();

  // Save extracted domains for future runs
  saveExtractedDomains(domains);

  // Ensure the exact number of URLs is returned
  return Array.from(validUrls).slice(0, numUrls);
}

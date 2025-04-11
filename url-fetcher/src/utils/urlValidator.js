import { settings } from "../config/settings.js";

// Basic URL format validation
export function isValidUrlFormat(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Normalize URLs to avoid duplicates (remove trailing slashes, unnecessary query params)
export function normalizeUrl(url) {
  try {
    const parsedUrl = new URL(url);

    // Convert hostname to lowercase
    parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

    // Remove common tracking parameters
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ];
    const params = parsedUrl.searchParams;
    paramsToRemove.forEach((param) => {
      if (params.has(param)) {
        params.delete(param);
      }
    });

    // Remove default ports (80 for http, 443 for https)
    if (
      (parsedUrl.protocol === "http:" && parsedUrl.port === "80") ||
      (parsedUrl.protocol === "https:" && parsedUrl.port === "443")
    ) {
      parsedUrl.port = "";
    }

    // Remove trailing slash from path if it's the only path character
    if (parsedUrl.pathname === "/") {
      parsedUrl.pathname = "";
    }

    // Remove fragments/anchors for URL comparison
    parsedUrl.hash = "";

    return parsedUrl.toString();
  } catch (e) {
    return url; // If something goes wrong, return the original URL
  }
}

// Get the domain level (TLD depth)
function getDomainLevel(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.split(".").length;
  } catch {
    return 0;
  }
}

// Check if URL is from an excluded domain
function isExcludedDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return settings.excludedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return true; // If there's an error parsing, exclude it
  }
}

// Extended URL validation with more nuanced criteria
export async function isValidUrl(url, fetchFn = null) {
  // Basic format validation
  if (!isValidUrlFormat(url)) {
    return false;
  }

  const normalizedUrl = settings.normalizeUrls ? normalizeUrl(url) : url;

  // Check domain exclusions
  if (isExcludedDomain(normalizedUrl)) {
    return false;
  }

  // Check domain level (avoid too generic or too specific domains)
  const domainLevel = getDomainLevel(normalizedUrl);
  if (domainLevel < settings.minDomainLevel || domainLevel > 5) {
    return false;
  }

  // Check file extensions
  if (
    settings.excludedExtensions.some((ext) =>
      normalizedUrl.toLowerCase().endsWith(ext)
    )
  ) {
    return false;
  }

  // Check excluded paths
  if (settings.excludedPaths.some((path) => normalizedUrl.includes(path))) {
    return false;
  }

  // Check URL patterns - exclusions
  if (
    settings.urlPatterns &&
    settings.urlPatterns.exclude &&
    settings.urlPatterns.exclude.some((pattern) => pattern.test(normalizedUrl))
  ) {
    return false;
  }

  // Optional: Check if URL actually responds (if fetchFn provided)
  if (fetchFn) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        settings.timeout / 2
      );

      const response = await fetchFn(normalizedUrl, {
        method: "HEAD",
        headers: settings.headers,
        signal: controller.signal,
        redirect: "follow",
        follow: settings.maxRedirects || 3,
      });

      clearTimeout(timeoutId);

      // Check status code
      if (!response.ok) {
        return false;
      }

      // Check content type if available from HEAD request
      const contentType = response.headers.get("content-type");
      if (
        contentType &&
        !settings.allowedContentTypes.some((type) =>
          contentType.toLowerCase().includes(type.toLowerCase())
        )
      ) {
        return false;
      }

      return true;
    } catch (error) {
      return false; // Failed to fetch or timed out
    }
  }

  return true;
}

// Check if a URL is worth crawling deeper (more specific validation)
export async function isWorthCrawling(url, visitedUrls, validUrls) {
  // Already processed this URL
  if (visitedUrls.has(url)) {
    return false;
  }

  // Basic validation
  if (!(await isValidUrl(url))) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // Check existing URLs from this domain (diversity control)
    const urlsFromDomain = Array.from(validUrls).filter((vUrl) => {
      try {
        return new URL(vUrl).hostname === hostname;
      } catch {
        return false;
      }
    });

    // If we already have enough URLs from this domain, skip
    if (urlsFromDomain.length >= settings.maxUrlsPerDomain) {
      return false;
    }

    // Prioritize URLs with simple paths (more likely to be content pages)
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 5) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export const settings = {
  numberOfUrls: 50,
  timeout: 8000,
  crawlDelay: 1000,
  maxUrlsPerDomain: 1, // Reduced to 1 to force more diversity
  headers: {
    "User-Agent":
      "URL-Fetcher-Bot/1.0 (+https://github.com/SumanReddy18/url-fetcher)",
  },
  seedUrls: [
    // Tech and Science
    "https://github.com",
    "https://mozilla.org",
    "https://wikipedia.org",
    "https://stackoverflow.com",
    // News and Media
    "https://reuters.com",
    "https://bbc.com",
    "https://theguardian.com",
    "https://nytimes.com",
    // Education
    "https://coursera.org",
    "https://edx.org",
    "https://mit.edu",
    "https://stanford.edu",
    // Business and Finance
    "https://bloomberg.com",
    "https://forbes.com",
    "https://wsj.com",
    // Technology News
    "https://techcrunch.com",
    "https://wired.com",
    "https://arstechnica.com",
    // General Interest
    "https://reddit.com",
    "https://medium.com",
  ],
  excludedDomains: [
    // ...existing code...
  ],
  // Add new settings for diversity
  minDomainLevel: 2, // Exclude too generic TLDs
  maxRedirects: 3, // Limit redirects
  acceptLanguages: ["en", "en-US", "en-GB"], // Focus on English content
};

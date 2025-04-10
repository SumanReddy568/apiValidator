export const settings = {
  numberOfUrls: 50,
  timeout: 5000,
  crawlDelay: 1000,
  headers: {
    "User-Agent":
      "URL-Fetcher-Bot/1.0 (+https://github.com/SumanReddy18/url-fetcher)",
  },
  seedUrls: [
    "https://github.com",
    "https://mozilla.org",
    "https://developer.mozilla.org",
    "https://wikipedia.org",
    "https://stackoverflow.com",
  ],
  excludedDomains: ["facebook.com", "twitter.com", "instagram.com"],
};

export const settings = {
  numberOfUrls: 50,
  timeout: 8000,
  crawlDelay: 1000,
  maxUrlsPerDomain: 3, // Limit URLs per domain for diversity
  headers: {
    "User-Agent":
      "URL-Fetcher-Bot/1.0 (+https://github.com/SumanReddy18/url-fetcher)",
  },
  seedUrls: [
    "https://github.com",
    "https://mozilla.org",
    "https://wikipedia.org",
    "https://stackoverflow.com",
    "https://newscientist.com",
    "https://nature.com",
    "https://sciencemag.org",
    "https://ieee.org",
    "https://arxiv.org",
    "https://springer.com",
  ],
  excludedDomains: [
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "youtube.com",
    "linkedin.com",
    "tiktok.com",
    "pinterest.com",
    "ads.",
    "analytics.",
    "tracker.",
    "advertising.",
  ],
};

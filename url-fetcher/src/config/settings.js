export const settings = {
  // Core settings
  numberOfUrls: 1000, // Significantly increased to allow broader crawling
  timeout: 10000, // Longer timeout for slower sites
  crawlDelay: 200, // Reduced to crawl faster but still respect servers
  maxUrlsPerDomain: 3, // Allow more URLs per domain for depth

  // Request headers that appear more like a real browser
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  },

  // Expanded seed URLs with diverse entry points
  seedUrls: [
    // Major directories
    "https://dmoz-odp.org",
    "https://curlie.org",
    "https://en.wikipedia.org/wiki/List_of_websites",
    "https://en.wikipedia.org/wiki/List_of_most_popular_websites",

    // Web Archives - great for finding diverse historical content
    "https://web.archive.org/web/20220000000000/https://www.alexa.com/topsites",
    "https://archive.is",

    // Knowledge & Reference
    "https://en.wikipedia.org/wiki/Portal:Contents",
    "https://stackoverflow.com",
    "https://quora.com",
    "https://reddit.com/r/all",

    // News & Media - international sources
    "https://reuters.com",
    "https://apnews.com",
    "https://bbc.com",
    "https://aljazeera.com",
    "https://france24.com",
    "https://dw.com",

    // Education & Academic
    "https://arxiv.org",
    "https://scholar.google.com",
    "https://academia.edu",
    "https://researchgate.net",
    "https://mit.edu",
    "https://stanford.edu",
    "https://ox.ac.uk",

    // Alternative Search Engines
    "https://duckduckgo.com",
    "https://ecosia.org",
    "https://qwant.com",
    "https://swisscows.com",
    "https://yandex.com",
    "https://baidu.com",

    // Tech & Open Source
    "https://github.com/topics",
    "https://gitlab.com/explore/projects",
    "https://sourceforge.net/directory",
    "https://dev.to",
    "https://hackernews.com",
    "https://slashdot.org",

    // International portals
    "https://yahoo.co.jp",
    "https://sina.com.cn",
    "https://yandex.ru",
    "https://globo.com",
    "https://naver.com",

    // Forums & Communities
    "https://forums.gentoo.org",
    "https://community.atlassian.com",
    "https://discourse.org",

    // Government & NGOs
    "https://un.org",
    "https://europa.eu",
    "https://who.int",
    "https://worldbank.org",

    // Diverse blogs & content
    "https://medium.com/topics",
    "https://wordpress.com/discover",
    "https://blogger.com/about",

    // Various industries
    "https://finance.yahoo.com",
    "https://coinmarketcap.com",
    "https://allrecipes.com",
    "https://imdb.com",
    "https://goodreads.com",
  ],

  // Only exclude domains that cause problems or have aggressive bot detection
  excludedDomains: [
    "facebook.com", // Often blocks crawlers
    "instagram.com", // Requires login
    "twitter.com", // Rate limits heavily
    "linkedin.com", // Blocks bots
    "captcha.com",
    "recaptcha.net",
    "solvemedia.com",
  ],

  // Crawling depth and diversity settings
  maxDepth: 5, // Crawl deeper to find more diverse content
  minContentLength: 500, // Reduced to include more diverse pages
  concurrentRequests: 20, // More parallel requests

  // Content type settings - accept more formats
  allowedContentTypes: [
    "text/html",
    "application/xhtml+xml",
    "application/xml",
    "text/plain",
  ],

  // URL filtering - only exclude obvious non-content
  excludedExtensions: [
    ".css",
    ".js",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".ico",
    ".zip",
    ".rar",
    ".gz",
    ".mp3",
    ".mp4",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".svg",
  ],

  // Exclude common asset paths but be less restrictive
  excludedPaths: ["/wp-admin/", "/cdn-cgi/", "/api/", "/wp-json/"],

  // URL pattern matching - use more lenient patterns
  urlPatterns: {
    // Must not match these patterns
    exclude: [
      /\.(min|bundle|vendor)\./, // Bundled files
      /\?(?:v|ver|version)=[^&]+/, // Versioned resources
      /\/feed\/?$/, // RSS feeds
      /signin|login|logout/i, // Auth pages
      /\/wp-admin\//, // WordPress admin
    ],
  },

  // Randomize referer to appear more like organic traffic
  useRandomReferer: true,

  // Enable URL normalization to avoid duplicates
  normalizeUrls: true,

  // Dynamic discovery options
  enableSitemapDiscovery: true,
  checkRobotsTxt: true,

  // Introduce randomness to crawling to appear more human-like
  randomizeRequestOrder: true,

  // Relaxed content requirements
  minTextContentRatio: 0.1, // More lenient text content requirement
};

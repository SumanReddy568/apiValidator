export const settings = {
  numberOfUrls: 50,
  timeout: 5000,          // Reduced timeout
  crawlDelay: 500,        // Reduced delay
  maxUrlsPerDomain: 2,    // Increased slightly for better coverage
  headers: {
    "User-Agent":
      "URL-Fetcher-Bot/1.0 (+https://github.com/SumanReddy18/url-fetcher)",
  },
  seedUrls: [
    // Popular Directories
    "https://dmoz-odp.org",
    "https://directory.google.com",
    "https://curlie.org",
    "https://botw.org",
    
    // Web Archives
    "https://web.archive.org",
    "https://archive.is",
    
    // Open Source
    "https://opensource.org",
    "https://sourceforge.net",
    "https://gitlab.com/explore",
    "https://github.com/explore",
    
    // Academic
    "https://arxiv.org",
    "https://scholar.google.com",
    "https://academia.edu",
    "https://researchgate.net",
    
    // Alternative Search Engines
    "https://duckduckgo.com",
    "https://qwant.com",
    "https://swisscows.com",
    
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
    "google.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "youtube.com",
    "amazon.com",
    "apple.com",
    "microsoft.com",
    "linkedin.com",
    "wordpress.com",
    "blogspot.com",
    "t.co",
    "bit.ly",
    "goo.gl",
  ],
  // Add new settings for diversity
  minDomainLevel: 2, // Exclude too generic TLDs
  maxRedirects: 3, // Limit redirects
  acceptLanguages: ["en", "en-US", "en-GB", "*"], // Accept all but prefer English

  // API Integration settings
  serpApi: {
    enabled: true,
    endpoint: 'https://serpapi.com/search',
    apiKey: 'YOUR_SERP_API_KEY', // Get from https://serpapi.com/
  },
  
  commonCrawl: {
    enabled: true,
    endpoint: 'https://index.commoncrawl.org/CC-MAIN-2023-14-index',
  },

  // Improved crawling settings
  maxDepth: 3,
  minContentLength: 1000, // Minimum content length to consider
  concurrentRequests: 10, // Increased concurrent requests
  
  // Content type settings
  allowedContentTypes: [
    "text/html",
    "application/xhtml+xml"
  ],

  // URL filtering settings
  excludedExtensions: [
    '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.ico', 
    '.xml', '.pdf', '.zip', '.rar', '.gz', '.mp3', '.mp4',
    '.woff', '.woff2', '.ttf', '.eot', '.svg'
  ],
  
  excludedPaths: [
    '/wp-content/',
    '/wp-includes/',
    '/assets/',
    '/static/',
    '/cdn-cgi/',
    '/dist/',
    '/build/',
    '/css/',
    '/js/',
    '/images/',
    '/fonts/',
    '/api/',
    '/wp-json/',
  ],

  // URL pattern matching
  urlPatterns: {
    // Must match these patterns
    include: [
      /^https?:\/\/[^\/]+\/[^\.]+$/,  // URLs with paths but no file extensions
      /^https?:\/\/[^\/]+\/?$/        // Root domain URLs
    ],
    // Must not match these patterns
    exclude: [
      /\.(min|bundle|vendor)\./,      // Bundled files
      /\?(?:v|ver|version)=[^&]+/,    // Versioned resources
      /\/feed\/?$/,                   // RSS feeds
      /\/page\/\d+/,                  // Pagination URLs
      /\/wp-/,                        // WordPress system files
      /\/cdn-/                        // CDN resources
    ]
  },

  // Minimum text content requirements
  minTextContentRatio: 0.3,           // Minimum ratio of text to HTML
};

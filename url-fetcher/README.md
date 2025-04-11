# @sumanreddy/url-fetcher

A powerful URL fetcher and crawler library that discovers and extracts valid URLs from the web.

## Installation

```bash
npm install @sumanreddy/url-fetcher
```

## Usage

```javascript
import { fetchUrls } from "@sumanreddy/url-fetcher";

// Fetch 10 URLs
const urls = await fetchUrls(10);
console.log(urls);

// Fetch default number of URLs
const moreUrls = await fetchUrls();
console.log(moreUrls);
```

## CLI Usage

```bash
node src/index.js 5  # Fetch 5 URLs
```

## Features

- Configurable URL count
- Smart crawling with retry mechanism
- Domain diversity control
- Bot detection avoidance
- Respects robots.txt and site policies

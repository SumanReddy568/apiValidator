import assert from "assert";
import { fetchDomains, getValidUrls } from "../src/utils/urlExtractor.js";
import { isValidUrlFormat } from "../src/utils/urlValidator.js";
import { settings } from "../src/config/settings.js";
import { JSDOM } from "jsdom";

async function runTests() {
  console.log("Running tests...");

  // Test domain fetching
  const uniqueDomains = await fetchDomains(() => [
    "example.com",
    "test.com",
    "example.com",
    "newdomain.com",
  ]);
  assert(Array.isArray(uniqueDomains), "Should return an array of domains");
  assert(
    uniqueDomains.length <= 3,
    "Should only include unique domains not previously stored"
  );
  console.log("Domain fetching test passed!");

  // Test URL format validation
  assert(
    isValidUrlFormat("https://example.com"),
    "Should validate correct URL format"
  );
  assert(!isValidUrlFormat("not-a-url"), "Should reject invalid URL format");
  console.log("URL format validation test passed!");

  // Test URL extraction
  const validUrls = await getValidUrls(
    async () => ({
      ok: true,
      text: async () => `
        <html>
          <body>
            <a href="https://example.com/page1">Page 1</a>
            <a href="https://example.com/page2">Page 2</a>
            <a href="https://test.com/page3">Page 3</a>
          </body>
        </html>
      `,
      headers: { get: () => "text/html" },
    }),
    JSDOM,
    5
  );
  assert(Array.isArray(validUrls), "Should return an array of URLs");
  assert(validUrls.length <= 5, "Should not exceed requested number of URLs");
  assert(
    validUrls.every((url) => url.startsWith("http")),
    "All URLs should start with http"
  );
  console.log("URL extraction test passed!");

  // Test excluded domains
  const hasExcludedDomain = validUrls.some((url) =>
    settings.excludedDomains.some((domain) => url.includes(domain))
  );
  assert(!hasExcludedDomain, "Should not include excluded domains");
  console.log("Excluded domains test passed!");

  console.log("All tests passed!");
}

runTests().catch(console.error);

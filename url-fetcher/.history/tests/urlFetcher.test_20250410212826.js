import assert from "assert";
import { getValidUrls } from "../src/utils/urlExtractor.js";
import { isValidUrl, isValidUrlFormat } from "../src/utils/urlValidator.js";
import { settings } from "../src/config/settings.js";

async function runTests() {
  console.log("Running tests...");

  // Test URL format validation
  assert(
    isValidUrlFormat("https://example.com"),
    "Should validate correct URL format"
  );
  assert(!isValidUrlFormat("not-a-url"), "Should reject invalid URL format");

  // Test URL fetching
  const urls = await getValidUrls(5); // Test with small number
  assert(Array.isArray(urls), "Should return an array");
  assert(urls.length <= 5, "Should not exceed requested number of URLs");
  assert(
    urls.every((url) => url.startsWith("http")),
    "All URLs should start with http"
  );

  // Test excluded domains
  const hasExcludedDomain = urls.some((url) =>
    settings.excludedDomains.some((domain) => url.includes(domain))
  );
  assert(!hasExcludedDomain, "Should not include excluded domains");

  console.log("All tests passed!");
}

runTests().catch(console.error);

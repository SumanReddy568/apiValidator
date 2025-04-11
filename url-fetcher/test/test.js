import { fetchUrls } from "../src/index.js";

// Basic test
console.log("Testing URL fetcher...");

async function runTest() {
  try {
    // Test with different counts
    console.log("Fetching 5 URLs...");
    const urls = await fetchUrls(5);
    console.log("Found URLs:", urls);

    // Test without count (should use default)
    console.log("\nFetching with default count...");
    const defaultUrls = await fetchUrls();
    console.log("Found URLs count:", defaultUrls.length);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTest();

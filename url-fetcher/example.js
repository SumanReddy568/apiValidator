import { fetchUrls } from "./src/index.js";

async function example() {
  try {
    // Fetch 5 URLs
    console.log("Fetching 5 URLs...");
    const urls = await fetchUrls(5);
    console.log("Found URLs:", urls);
  } catch (error) {
    console.error("Error:", error);
  }
}

example();

import { getValidUrls } from "./utils/urlExtractor.js";
import { logger } from "./utils/logger.js";
import { settings } from "./config/settings.js";

async function main() {
  try {
    logger.info("Starting URL fetching process...");
    const startTime = Date.now();

    const urls = await getValidUrls(settings.numberOfUrls);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    logger.info(
      `Successfully fetched ${urls.length} URLs in ${duration} seconds`
    );
    logger.info("Found URLs:", urls);

    return urls;
  } catch (error) {
    logger.error("Error in main process:", error);
    throw error;
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    logger.error("Fatal error:", error);
    process.exit(1);
  });
}

export { main };

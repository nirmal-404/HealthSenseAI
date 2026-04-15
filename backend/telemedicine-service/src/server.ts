import "dotenv/config";
import { createApp } from "./app";
import { CONFIG } from "./config/envConfig";
import { connectDb } from "./config/db";
import { logger } from "./utils/logger";

/**
 * HTTP server bootstrap.
 */
async function main() {
  await connectDb();
  const app = createApp();
  app.listen(CONFIG.PORT, () => {
    logger.info(`Telemedicine listening on ${CONFIG.PORT}`);
  });
}

main().catch((e) => {
  logger.error("Fatal startup", { err: String(e) });
  process.exit(1);
});

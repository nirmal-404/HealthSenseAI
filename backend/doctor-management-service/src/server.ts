import "dotenv/config";
import { createApp } from "./app";
import { CONFIG } from "./config/envConfig";
import { connectDb } from "./config/db";
import { logger } from "./utils/logger";

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(CONFIG.PORT, () => {
    logger.info(`Doctor management listening on ${CONFIG.PORT}`);
  });
}

main().catch((e) => {
  logger.error("Fatal", { err: String(e) });
  process.exit(1);
});

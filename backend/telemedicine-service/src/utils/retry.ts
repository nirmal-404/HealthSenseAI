import { CONFIG } from "../config/envConfig";
import { logger } from "./logger";

/**
 * Runs an async function with exponential backoff retries.
 */
export async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = CONFIG.RETRY_ATTEMPTS,
  baseDelayMs = CONFIG.RETRY_BASE_DELAY_MS,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseDelayMs * Math.pow(2, i);
      logger.warn(`${label} attempt ${i + 1}/${attempts} failed`, {
        error: String(e),
        waitMs: wait,
      });
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

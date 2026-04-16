import { CONFIG } from "../config/envConfig";
import { logger } from "./logger";

const ATTEMPTS = 3;
const BASE = 500;

/**
 * Retries an async operation with exponential backoff.
 */
export async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const wait = BASE * Math.pow(2, i);
      logger.warn(`${label} retry`, { attempt: i + 1, wait });
      if (i < ATTEMPTS - 1) await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
}

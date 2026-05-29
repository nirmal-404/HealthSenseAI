import Redis from "ioredis";
import { CONFIG } from "../config/envConfig";
import { logger } from "../utils/logger";

/**
 * Publishes JSON payloads to Redis channels (fire-and-forget).
 */
export class RedisEventPublisher {
  private client: Redis | null = null;

  private getClient(): Redis {
    if (!this.client) {
      this.client = new Redis(CONFIG.REDIS_URL, {
        maxRetriesPerRequest: 1,
      });
    }
    return this.client;
  }

  /**
   * Publishes an event; swallows errors after logging.
   */
  async publish(channel: string, payload: unknown): Promise<void> {
    try {
      const c = this.getClient();
      await c.publish(channel, JSON.stringify(payload));
    } catch (e) {
      logger.error("Redis publish failed", { channel, error: String(e) });
    }
  }
}

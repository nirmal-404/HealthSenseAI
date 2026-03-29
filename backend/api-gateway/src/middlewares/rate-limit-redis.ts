import { rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import Redis from "ioredis";

const client = new Redis({
  host: "redis",
  port: 6379,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 5,
});

client.on("connect", () => console.log("Connected to Redis"));
client.on("error", (err) => console.error("Redis Error:", err.message));

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<RedisReply>,
  }),
});

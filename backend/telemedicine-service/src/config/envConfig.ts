import "dotenv/config";

const num = (v: string | undefined, d: number) =>
  v !== undefined && v !== "" ? Number(v) : d;

export const CONFIG = {
  PORT: num(process.env.PORT, 50008),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI:
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/healthsenseai_telemedicine",
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY || "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  JITSI_PUBLIC_DOMAIN:
    process.env.JITSI_PUBLIC_DOMAIN || "meet.jit.si",
  HTTP_TIMEOUT_MS: num(process.env.HTTP_TIMEOUT_MS, 30000),
  RETRY_ATTEMPTS: num(process.env.RETRY_ATTEMPTS, 3),
  RETRY_BASE_DELAY_MS: num(process.env.RETRY_BASE_DELAY_MS, 500),
  CLAUDE_MODEL:
    process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
};

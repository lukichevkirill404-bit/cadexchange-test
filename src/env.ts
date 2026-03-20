import dotenv from "dotenv";

dotenv.config();

function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  redisHost: process.env.REDIS_HOST ?? "127.0.0.1",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  redisPassword: process.env.REDIS_PASSWORD ?? undefined,
  seatTtlMs: Number(process.env.REDIS_SEAT_TTL_MS ?? 0),

  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 8000),
  seatKeyPrefix: process.env.SEAT_KEY_PREFIX ?? "seat:",
};

export type Env = typeof env;


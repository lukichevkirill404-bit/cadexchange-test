import express from "express";
import pinoHttp from "pino-http";
import pino from "pino";
import IORedis from "ioredis";

import { env } from "./env";
import { SeatReservationService } from "./redis/seatReservation";
import { reserveRoute } from "./routes/reserve";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
});

async function main() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/health" },
    })
  );

  let redisReadyFlag = false;

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", redisReady: redisReadyFlag });
  });

  const redis = new IORedis({
    host: env.redisHost,
    port: env.redisPort,
    password: env.redisPassword,
    maxRetriesPerRequest: 3,
  });

  const reservationService = new SeatReservationService(redis, env.seatKeyPrefix, env.seatTtlMs);
  const reserveHandler = reserveRoute(reservationService);
  try {
    await redis.ping();
    await reservationService.init();
    redisReadyFlag = true;
    logger.info("Redis is ready");
  } catch (err) {
    logger.error({ err }, "Redis initialization failed; /reserve will return 503");
  }

  app.post("/reserve", (req, res, next) => {
    if (!redisReadyFlag) {
      return res.status(503).json({ status: "redis_not_ready" });
    }
    return reserveHandler(req, res, next);
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : "Internal server error";
    requestScopedErrorLog(message);
    res.status(500).json({ status: "error", message });
  });

  const server = app.listen(env.port, () => {
    logger.info({ port: env.port }, "Server started");
  });

  const shutdown = async () => {
    logger.info("Shutting down...");
    server.close();
    await redis.quit();
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

function requestScopedErrorLog(message: string) {
  logger.error({ message }, "Request failed");
}

main().catch((err) => {
  logger.error({ err }, "Fatal error");
  process.exit(1);
});


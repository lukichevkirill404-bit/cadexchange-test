"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pino_http_1 = __importDefault(require("pino-http"));
const pino_1 = __importDefault(require("pino"));
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const seatReservation_1 = require("./redis/seatReservation");
const reserve_1 = require("./routes/reserve");
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL ?? "info",
});
async function main() {
    const app = (0, express_1.default)();
    app.disable("x-powered-by");
    app.use(express_1.default.json({ limit: "256kb" }));
    app.use((0, pino_http_1.default)({
        logger,
        autoLogging: { ignore: (req) => req.url === "/health" },
    }));
    let redisReadyFlag = false;
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok", redisReady: redisReadyFlag });
    });
    const redis = new ioredis_1.default({
        host: env_1.env.redisHost,
        port: env_1.env.redisPort,
        password: env_1.env.redisPassword,
        maxRetriesPerRequest: 3,
    });
    const reservationService = new seatReservation_1.SeatReservationService(redis, env_1.env.seatKeyPrefix, env_1.env.seatTtlMs);
    const reserveHandler = (0, reserve_1.reserveRoute)(reservationService);
    try {
        await redis.ping();
        await reservationService.init();
        redisReadyFlag = true;
        logger.info("Redis is ready");
    }
    catch (err) {
        logger.error({ err }, "Redis initialization failed; /reserve will return 503");
    }
    app.post("/reserve", (req, res, next) => {
        if (!redisReadyFlag) {
            return res.status(503).json({ status: "redis_not_ready" });
        }
        return reserveHandler(req, res, next);
    });
    app.use((err, _req, res, _next) => {
        const message = err instanceof Error ? err.message : "Internal server error";
        requestScopedErrorLog(message);
        res.status(500).json({ status: "error", message });
    });
    const server = app.listen(env_1.env.port, () => {
        logger.info({ port: env_1.env.port }, "Server started");
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
function requestScopedErrorLog(message) {
    logger.error({ message }, "Request failed");
}
main().catch((err) => {
    logger.error({ err }, "Fatal error");
    process.exit(1);
});

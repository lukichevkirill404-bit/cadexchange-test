"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function mustGet(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing env var: ${name}`);
    return v;
}
exports.env = {
    port: Number(process.env.PORT ?? 3000),
    redisHost: process.env.REDIS_HOST ?? "127.0.0.1",
    redisPort: Number(process.env.REDIS_PORT ?? 6379),
    redisPassword: process.env.REDIS_PASSWORD ?? undefined,
    seatTtlMs: Number(process.env.REDIS_SEAT_TTL_MS ?? 0),
    requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 8000),
    seatKeyPrefix: process.env.SEAT_KEY_PREFIX ?? "seat:",
};

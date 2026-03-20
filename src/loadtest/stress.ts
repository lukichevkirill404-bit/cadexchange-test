import autocannon from "autocannon";

function intFromEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const url = process.env.TARGET_URL ?? "http://localhost:3000/reserve";
const seatId = process.env.SEAT_ID ?? "1";
const userId = process.env.USER_ID ?? "1";

const connections = intFromEnv("CONNECTIONS", 2000);
const duration = intFromEnv("DURATION_SEC", 20);

console.log(`Stress ${url} seat_id=${seatId} connections=${connections} duration=${duration}s`);

autocannon(
  {
    url,
    method: "POST",
    headers: { "content-type": "application/json" },
    connections,
    duration,
    pipelining: 1,
    body: JSON.stringify({ user_id: userId, seat_id: String(seatId) }),
    timeout: 5000,
  },
  (err: Error | null, res: any) => {
    if (err) {
      console.error("autocannon error:", err);
      process.exit(1);
    }

    console.log("Done.");
    console.log({
      requestsSent: res?.requests?.sent,
      errors: res?.errors,
      timeouts: res?.timeouts,
      status2xx: res?.["2xx"],
      status4xx: res?.["4xx"],
      status5xx: res?.["5xx"],
      statusCodeStats: res?.statusCodeStats,
    });
  }
);


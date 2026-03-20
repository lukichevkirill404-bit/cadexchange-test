import IORedis from "ioredis";

export class SeatReservationService {
  private scriptSha: string | null = null;

  constructor(
    private readonly redis: IORedis,
    private readonly seatKeyPrefix: string,
    private readonly seatTtlMs: number
  ) {}

  public async init(): Promise<void> {
    const lua = `
      local seatKey = KEYS[1]
      local userId = ARGV[1]
      local ttlMs = tonumber(ARGV[2])

      if redis.call('EXISTS', seatKey) == 0 then
        if ttlMs ~= nil and ttlMs > 0 then
          redis.call('SET', seatKey, userId, 'PX', ttlMs)
        else
          redis.call('SET', seatKey, userId)
        end
        return {1}
      else
        local existing = redis.call('GET', seatKey)
        return {0, existing}
      end
    `.trim();

    const sha = await (this.redis as any).script("load", lua);
    this.scriptSha = String(sha);
  }

  public async reserveSeat(userId: string, seatId: string): Promise<{ ok: true } | { ok: false; existingUserId: string }> {
    if (!this.scriptSha) throw new Error("SeatReservationService is not initialized");

    const seatKey = `${this.seatKeyPrefix}${seatId}`;
    const ttlArg = String(this.seatTtlMs);

    const result = (await this.redis.evalsha(this.scriptSha, 1, seatKey, userId, ttlArg)) as unknown[];
    const ok = Number(result[0]);

    if (ok === 1) return { ok: true };
    const existingUserId = String(result[1] ?? "");
    if (!existingUserId) throw new Error("Seat is reserved but existing user id is empty");
    return { ok: false, existingUserId };
  }
}


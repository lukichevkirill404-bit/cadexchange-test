import { SeatReservationService } from "./seatReservation";

class FakeRedis {
  private readonly store = new Map<string, string>();
  private scriptLoaded = false;

  public evalshaCalls: Array<{
    sha: string;
    keysCount: number;
    seatKey: string;
    userId: string;
    ttlArg: string;
  }> = [];

  public async script(subcommand: string, _lua: string): Promise<string> {
    if (subcommand !== "load") throw new Error(`Unexpected script subcommand: ${subcommand}`);
    this.scriptLoaded = true;
    return "fake-sha-1";
  }

  public async evalsha(
    sha: string,
    keysCount: number,
    seatKey: string,
    userId: string,
    ttlArg: string
  ): Promise<unknown[]> {
    if (!this.scriptLoaded) throw new Error("SCRIPT not loaded");
    if (keysCount !== 1) throw new Error(`Expected keysCount=1, got ${keysCount}`);

    this.evalshaCalls.push({ sha, keysCount, seatKey, userId, ttlArg });

    if (!this.store.has(seatKey)) {
      this.store.set(seatKey, userId);
      return [1];
    }
    return [0, this.store.get(seatKey)];
  }
}

describe("SeatReservationService", () => {
  it("reserves seat for first user", async () => {
    const fake = new FakeRedis();
    const svc = new SeatReservationService(fake as any, "seat:", 0);

    await svc.init();

    const r1 = await svc.reserveSeat("u1", "42");
    expect(r1).toEqual({ ok: true });

    const r2 = await svc.reserveSeat("u2", "42");
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.existingUserId).toBe("u1");
    }
  });

  it("only one concurrent reservation succeeds for same seat", async () => {
    const fake = new FakeRedis();
    const svc = new SeatReservationService(fake as any, "seat:", 0);
    await svc.init();

    const seatId = "99";
    const users = Array.from({ length: 200 }, (_, i) => `user-${i}`);

    const results = await Promise.all(users.map((u) => svc.reserveSeat(u, seatId)));

    const successCount = results.filter((r) => r.ok).length;
    expect(successCount).toBe(1);

    const winner = results.find((r) => r.ok);
    expect(winner).toEqual({ ok: true });
  });

  it("passes TTL argument to evalsha", async () => {
    const fake = new FakeRedis();
    const svc = new SeatReservationService(fake as any, "seat:", 12345);
    await svc.init();

    await svc.reserveSeat("u1", "10");

    expect(fake.evalshaCalls.length).toBe(1);
    expect(fake.evalshaCalls[0].ttlArg).toBe("12345");
  });
});


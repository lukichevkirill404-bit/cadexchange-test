import { reserveRoute } from "./reserve";

function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("reserveRoute", () => {
  it("returns 200 success when seat is free", async () => {
    const service = {
      reserveSeat: jest.fn().mockResolvedValue({ ok: true }),
    };

    const handler = reserveRoute(service as any);
    const req: any = { body: { user_id: 1, seat_id: 2 } };
    const res = mockResponse();
    const next = jest.fn();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      user_id: "1",
      seat_id: "2",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 409 already_reserved when seat is taken", async () => {
    const service = {
      reserveSeat: jest.fn().mockResolvedValue({ ok: false, existingUserId: "777" }),
    };

    const handler = reserveRoute(service as any);
    const req: any = { body: { user_id: 1, seat_id: 2 } };
    const res = mockResponse();
    const next = jest.fn();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      status: "already_reserved",
      user_id: "1",
      seat_id: "2",
      user_id_existing: "777",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_request on bad payload", async () => {
    const service = {
      reserveSeat: jest.fn(),
    };

    const handler = reserveRoute(service as any);
    const req: any = { body: { user_id: "abc", seat_id: 2 } };
    const res = mockResponse();
    const next = jest.fn();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "invalid_request",
      })
    );
    expect(service.reserveSeat).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});


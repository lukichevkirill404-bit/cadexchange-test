import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import type { SeatReservationService } from "../redis/seatReservation";

export const reserveSchema = z.object({
  user_id: z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]).transform(String),
  seat_id: z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]).transform(String),
});

type ReserveBody = z.infer<typeof reserveSchema>;

export function reserveRoute(service: SeatReservationService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = reserveSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          status: "invalid_request",
          details: parsed.error.flatten(),
        });
      }

      const { user_id, seat_id } = parsed.data as ReserveBody;
      const outcome = await service.reserveSeat(String(user_id), String(seat_id));

      if (outcome.ok) {
        return res.status(200).json({
          status: "success",
          user_id,
          seat_id,
        });
      }

      return res.status(409).json({
        status: "already_reserved",
        user_id,
        seat_id,
        user_id_existing: outcome.existingUserId,
      });
    } catch (err) {
      next(err);
    }
  };
}


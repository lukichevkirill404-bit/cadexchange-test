"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserveSchema = void 0;
exports.reserveRoute = reserveRoute;
const zod_1 = require("zod");
exports.reserveSchema = zod_1.z.object({
    user_id: zod_1.z.union([zod_1.z.string().regex(/^\d+$/), zod_1.z.number().int().nonnegative()]).transform(String),
    seat_id: zod_1.z.union([zod_1.z.string().regex(/^\d+$/), zod_1.z.number().int().nonnegative()]).transform(String),
});
function reserveRoute(service) {
    return async (req, res, next) => {
        try {
            const parsed = exports.reserveSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    status: "invalid_request",
                    details: parsed.error.flatten(),
                });
            }
            const { user_id, seat_id } = parsed.data;
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
        }
        catch (err) {
            next(err);
        }
    };
}

import express from "express";
import {
  createSeat,
  getAllSeats,
  getSeatById,
  updateSeat,
  hardDeleteSeat,
  updateSeatStatus
} from "../controllers/seat.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createSeatSchema,
  updateSeatSchema
} from "../validations/seat.validate";
import { checkAuth, checkAdminStaff } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth);
router.post("/", validateRequest(createSeatSchema), createSeat);
router.get("/", getAllSeats);
router.get("/:id", getSeatById);
router.put("/:id", validateRequest(updateSeatSchema), updateSeat);
router.delete("/:id", hardDeleteSeat);
router.patch("/:id/status", updateSeatStatus);

export default router;

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
import { checkAuth, checkAdmin } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth);
router.get("/", getAllSeats);
router.get("/:id", getSeatById);
router.patch("/:id/status", updateSeatStatus);

router.use(checkAdmin);
router.post("/", validateRequest(createSeatSchema), createSeat);
router.put("/:id", validateRequest(updateSeatSchema), updateSeat);
router.delete("/:id", hardDeleteSeat);

export default router;

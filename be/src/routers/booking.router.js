import express from "express";
import {
  createBooking,
  getListBooking,
  getBookingById,
  updateBooking,
  softDeleteBooking,
  hardDeleteBooking,
  updateBookingStatus,
  addStaffToBooking,
  removeStaffFromBooking,
  getTodaySchedule,
} from "../controllers/booking.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { checkAuth, checkAdminReceptionist } from "../middlewares/checkAuth";
import {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  modifyBookingStaffSchema,
} from "../validations/booking.validate";

const router = express.Router();

router.use(checkAuth);
router.get("/", getListBooking);
router.get("/today", getTodaySchedule);
router.get("/:id", getBookingById);
router.patch("/:id/status", validateRequest(updateBookingStatusSchema), updateBookingStatus);

router.use(checkAdminReceptionist);
router.post("/", validateRequest(createBookingSchema), createBooking);
router.put("/:id", validateRequest(updateBookingSchema), updateBooking);
router.delete("/:id", hardDeleteBooking);

// Staff assignment123
router.post(
  "/:id/staff",
  validateRequest(modifyBookingStaffSchema),
  addStaffToBooking
);
router.delete(
  "/:id/staff",
  validateRequest(modifyBookingStaffSchema),
  removeStaffFromBooking
);

export default router;



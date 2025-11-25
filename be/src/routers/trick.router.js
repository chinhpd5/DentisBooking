import express from "express";
import {
  createTrick,
  getAllTrick,
  getListTrick,
  getTrickById,
  updateTrick,
  softDeleteTrick,
  hardDeleteTrick,
  updateTrickStatus
} from "../controllers/trick.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createTrickSchema,
  updateTrickSchema
} from "../validations/trick.validate";
import { checkAuth, checkAdmin } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth);

router.get("/", getListTrick);
router.get("/all", getAllTrick);
router.get("/:id", getTrickById);

router.use(checkAdmin);
router.post("/", validateRequest(createTrickSchema), createTrick);
router.put("/:id", validateRequest(updateTrickSchema), updateTrick);
router.patch("/:id/status", updateTrickStatus);
router.delete("/:id", softDeleteTrick);

export default router;


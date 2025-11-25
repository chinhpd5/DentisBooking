import express from "express";
import {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation
} from "../controllers/location.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createLocationSchema,
  updateLocationSchema
} from "../validations/location.validate";
import { checkAuth,checkAdmin } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth);
router.get("/", getAllLocations);
router.get("/:id", getLocationById);

router.use(checkAdmin);
router.post("/", validateRequest(createLocationSchema), createLocation);
router.put("/:id", validateRequest(updateLocationSchema), updateLocation);
router.delete("/:id", deleteLocation);

export default router;

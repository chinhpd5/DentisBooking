import express from "express";
import {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation
} from "../controllers/location.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import {
  createLocationSchema,
  updateLocationSchema
} from "../validations/location.validate";
import { checkAuth } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth, checkAdminStaff);
router.post("/", validateRequest(createLocationSchema), createLocation);
router.get("/", getAllLocations);
router.get("/:id", getLocationById);
router.put("/:id", validateRequest(updateLocationSchema), updateLocation);
router.delete("/:id", deleteLocation);

export default router;

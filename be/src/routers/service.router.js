import express from "express";
import {
  createService,
  getListService,
  getByIdService,
  getAllService,
  updateService,
  softDeleteService,
  hardDeleteService,
  updateServiceStatus,
  getAllServiceIsFirst,
} from "../controllers/service.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../validations/service.validate";
import { checkAuth, checkAdminStaff } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth, checkAdminStaff);

router.post("/", validateRequest(createServiceSchema), createService);
router.get("/", getListService);
router.get("/all", getAllService);
router.get("/first", getAllServiceIsFirst);
router.get("/:id", getByIdService);
router.put("/:id", validateRequest(updateServiceSchema), updateService);
router.patch("/:id/status", updateServiceStatus);
router.delete("/:id", softDeleteService);

export default router;


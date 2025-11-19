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
import { checkAuth,checkAdminReceptionist } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth);
router.get("/", getListService);
router.get("/all", getAllService);
router.get("/first", getAllServiceIsFirst);
router.get("/:id", getByIdService);


router.use(checkAdminReceptionist);
router.patch("/:id/status", updateServiceStatus);
router.post("/", validateRequest(createServiceSchema), createService);
router.put("/:id", validateRequest(updateServiceSchema), updateService);
router.delete("/:id", softDeleteService);

export default router;


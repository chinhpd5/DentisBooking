import express from "express";
import {
  createJob,
  getListJob,
  getByIdJob,
  getAllJob,
  updateJob,
  softDeleteJob,
  hardDeleteJob,
  updateJobStatus,
  getAllJobIsFirst
} from "../controllers/job.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createJobSchema,
  updateJobSchema
} from "../validations/job.validate";
import { checkAuth, checkAdminStaff } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth, checkAdminStaff);

router.post("/", validateRequest(createJobSchema), createJob);
router.get("/", getListJob);
router.get("/all", getAllJob);
router.get("/first", getAllJobIsFirst);
router.get("/:id", getByIdJob);
router.put("/:id", validateRequest(updateJobSchema), updateJob);
router.patch("/:id/status", updateJobStatus);
router.delete("/:id", softDeleteJob);

export default router;


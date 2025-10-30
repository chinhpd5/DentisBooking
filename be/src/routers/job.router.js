import express from "express";
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  softDeleteJob,
  hardDeleteJob,
    updateJobStatus,
  getJobIsFirst
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
router.get("/", getAllJobs);
router.get("/first", getJobIsFirst);
router.get("/:id", getJobById);
router.put("/:id", validateRequest(updateJobSchema), updateJob);
router.patch("/:id/status", updateJobStatus);
router.delete("/:id", hardDeleteJob);

export default router;


import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  sortDeleteEmployee,
  hardDeleteEmployee,
  updateEmployee,
  updateEmployeeStatus,
  getAllStaff
} from "../controllers/staff.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { createStaffSchema, updateStaffSchema } from "../validations/staff.validate";
import { checkAuth,checkAdmin } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth, checkAdmin);

router.post("/", validateRequest(createStaffSchema), createEmployee);
router.get("/", getAllEmployees);
router.get("/all",getAllStaff);
router.get("/:id", getEmployeeById);
router.put("/:id", validateRequest(updateStaffSchema), updateEmployee);
router.put("/:id/status", updateEmployeeStatus);
router.delete("/:id", sortDeleteEmployee);

export default router;
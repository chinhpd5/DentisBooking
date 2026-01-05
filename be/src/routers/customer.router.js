import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerByPhone,
  getCustomersByPhone
} from "../controllers/customer.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createCustomerSchema,
  updateCustomerSchema
} from "../validations/customer.validate";
import { checkAuth } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth);
router.post("/", validateRequest(createCustomerSchema), createCustomer);
router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", validateRequest(updateCustomerSchema), updateCustomer);
router.delete("/:id", deleteCustomer);
router.get("/phone/:phone", getCustomerByPhone);
router.get("/phones/:phone", getCustomersByPhone);

export default router;

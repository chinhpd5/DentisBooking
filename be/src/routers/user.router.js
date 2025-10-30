import express from "express"
import {
  deleteUser,
  getAllUsers,
  getUserById,
  login,
  register,
  updateUser,
  updateUserStatus,
  changePassword,
  resetPassword,
  
} from "../controllers/user.controller";
import {checkAdmin, checkAuth } from "../middlewares/checkAuth";
import { validateRequest } from "../middlewares/validateRequest";
import { registerSchema, loginSchema,changePasswordSchema,resetPasswordSchema } from "../validations/user.validate";

const router = express.Router();

// Đăng ký đăng nhập
router.post("/register",validateRequest(registerSchema),register);
router.post("/login",validateRequest(loginSchema),login);

router.use(checkAuth);
router.post("/change-password", validateRequest(changePasswordSchema),changePassword);
router.get("/:id",getUserById);

router.use(checkAdmin);
router.get("/",getAllUsers);
router.delete("/:id",deleteUser);
router.put("/:id",updateUser);
router.get("/:id/status",updateUserStatus);
router.post("/reset-password",validateRequest(resetPasswordSchema),resetPassword);




export default router;
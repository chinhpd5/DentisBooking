import express from "express";
import { getNotifications } from "../controllers/notification.controller";
import { checkAuth } from "../middlewares/checkAuth";

const router = express.Router();

router.use(checkAuth);
router.get("/", getNotifications);

export default router;


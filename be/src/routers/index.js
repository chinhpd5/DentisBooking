import express from "express";
import staffRouter from "./staff.router";
import userRouter from './user.router';
import customerRouter from "./customer.router";
import locationRouter from "./location.router";
import seatRouter from "./seat.router";

const routers = express.Router();

routers.use("/auth", userRouter);
routers.use("/staff", staffRouter);
routers.use("/location", locationRouter);
routers.use("/user", userRouter);
routers.use("/customer", customerRouter);
routers.use("/seat", seatRouter);

export default routers;
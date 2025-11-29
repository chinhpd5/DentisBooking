import express from "express";
import staffRouter from "./staff.router";
import userRouter from './user.router';
import customerRouter from "./customer.router";
import locationRouter from "./location.router";
import seatRouter from "./seat.router";
import jobRouter from "./job.router";
import trickRouter from "./trick.router";
import bookingRouter from "./booking.router";
import serviceRouter from "./service.router";
import notificationRouter from "./notification.router";

const routers = express.Router();

routers.use("/auth", userRouter);
routers.use("/user", userRouter);
routers.use("/staff", staffRouter);
routers.use("/location", locationRouter);
routers.use("/customer", customerRouter);
routers.use("/seat", seatRouter);
routers.use("/job", jobRouter);
routers.use("/trick", trickRouter);
routers.use("/booking", bookingRouter);
routers.use("/service", serviceRouter);
routers.use("/notification", notificationRouter);

export default routers;
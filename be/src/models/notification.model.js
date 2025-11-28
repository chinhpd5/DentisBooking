import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { SEAT_STATUS } from "../utils/constants";

const notificationSchema = new mongoose.Schema(
  {
    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },
    seatName: {
      type: String,
      required: true,
      trim: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromStatus: {
      type: Number,
      enum: Object.values(SEAT_STATUS),
      required: true,
    },
    toStatus: {
      type: Number,
      enum: Object.values(SEAT_STATUS),
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.plugin(mongoosePaginate);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;


import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IS_DELETED, SEAT_STATUS } from "../utils/constants";

const seatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên ghế là bắt buộc"],
      trim: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: false
    },
    status: {
      type: Number,
      required: [true, "Trạng thái ghế là bắt buộc"],
      enum: Object.values(SEAT_STATUS),
      default: SEAT_STATUS.AVAILABLE,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    
    isDeleted: {
      type: Number,
      enum: Object.values(IS_DELETED),
      default: IS_DELETED.NO,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

seatSchema.plugin(mongoosePaginate);

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;


import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {BOOKING_STATUS,IS_DELETED} from "../utils/constants"

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  note: {
    type: String,
    default: "",
    trim: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  realDate: {
    type: Date,
    required: true,
  },
  priority: {
    type: boolean,
    required: true,
  },
  comingTime:{
    type: Date,
  },
  completeTime: {
    type: Date
  },
  // staffId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Staff",
  // },
  trickId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trick",
    }
  ],
  status: {
    type: Number,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.BOOKED,
  },
  isDeleted: {
    type: Number,
    enum: Object.values(IS_DELETED),
    default: IS_DELETED.NO,
  },
}, {
  timestamps: true,
  versionKey: false,
}); 

bookingSchema.plugin(mongoosePaginate);
const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
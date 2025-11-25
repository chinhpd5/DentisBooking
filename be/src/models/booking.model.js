import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {BOOKING_STATUS,IS_DELETED,SERVICE_TYPE} from "../utils/constants"

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
  timeEnd: {
    type: Date,
    required: true,
  },
  doctorDate: {
    type: Date,
    required: false,
  },
  priority: {
    type: Boolean,
    required: true,
  },
  comingTime:{
    type: Date,
  },
  doingTime: {
    type: Date,
  },
  completeTime: {
    type: Date
  },
  type:{
    type: String,
    enum: Object.values(SERVICE_TYPE),
    default: SERVICE_TYPE.TRICK,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: false,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: false,
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.BOOKED,
  },
  isDeleted: {
    type: Number,
    enum: Object.values(IS_DELETED),
    default: IS_DELETED.NO,
  },
  cancellationReason: {
    type: String,
    default: "",
    trim: true,
  },
  staffAssignments: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffAssignment",
    }],
    default: [],
  },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
}); 


// Helpful indexes for common queries
bookingSchema.index({ doctorId: 1 });
bookingSchema.index({ status: 1, appointmentDate: 1 });
bookingSchema.index({ staffAssignments: 1 });
bookingSchema.index({ isDeleted: 1 });

bookingSchema.plugin(mongoosePaginate);
const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
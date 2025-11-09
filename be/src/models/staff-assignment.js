import mongoose from "mongoose";

const staffAssignmentSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
  },
  serviceIds: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    }],
  },
  timeStart: {
    type: Date,
    required: true,
  },
  timeEnd: {
    type: Date,
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },  
}, {
  timestamps: true,
  versionKey: false,
});

const StaffAssignment = mongoose.model("StaffAssignment", staffAssignmentSchema);

export default StaffAssignment;
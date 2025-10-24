import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { USER_ROLE, STAFF_STATUS, IS_DELETED } from "../utils/constants";

const shiftSchema = new mongoose.Schema({
  start: {
    type: Number,
    required: true,
    min: 0,
    max: 1439 // tối đa 23:59
  },
  end: {
    type: Number,
    required: true,
    min: 0,
    max: 1439
  }
}, { _id: false });

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên nhân viên là bắt buộc"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Số điện thoại nhân viên là bắt buộc"],
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLE),
    default: USER_ROLE.STAFF,
  },
  email: {
    type: String,
  },
  scheduleMonday: {
    type: [shiftSchema],
    default: []
  },
  scheduleTuesday: {
    type: [shiftSchema],
    default: []
  },
  scheduleWednesday: {
    type: [shiftSchema],
    default: []
  },
  scheduleThursday: {
    type: [shiftSchema],
    default: []
  },
  scheduleFriday: {
    type: [shiftSchema],
    default: []
  },
  scheduleSaturday: {
    type: [shiftSchema],
    default: []
  },
  scheduleSunday: {
    type: [shiftSchema],
    default: []
  },
  status: {
    type: Number,
    enum: Object.values(STAFF_STATUS),
    default: STAFF_STATUS.ACTIVE,
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

staffSchema.plugin(mongoosePaginate);
const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
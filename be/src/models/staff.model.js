import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { USER_ROLE, STAFF_STATUS, IS_DELETED } from "../utils/constants";

const shiftSchema = new mongoose.Schema({
  morning: {
    start: {
      type: Number,
      min: 0,
      max: 1439
    },
    end: {
      type: Number,
      min: 0,
      max: 1439
    }
  },
  afternoon: {
    start: {
      type: Number,
      min: 0,
      max: 1439
    },
    end: {
      type: Number,
      min: 0,
      max: 1439
    }
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
    type: shiftSchema,
    required: false
  },
  scheduleTuesday: {
    type: shiftSchema,
    required: false
  },
  scheduleWednesday: {
    type: shiftSchema,
    required: false
  },
  scheduleThursday: {
    type: shiftSchema,
    required: false
  },
  scheduleFriday: {
    type: shiftSchema,
    required: false
  },
  scheduleSaturday: {
    type: shiftSchema,
    required: false
  },
  scheduleSunday: {
    type: shiftSchema,
    required: false
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
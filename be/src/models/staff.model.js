import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { USER_ROLE, STAFF_STATUS, IS_DELETED } from "../utils/constants";

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
  // scheduleStart: {
  //   type: String,
  //   required: [true, "Giờ bắt đầu ca làm việc là bắt buộc"],
  //   match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng giờ không hợp lệ (HH:MM)"]
  // },
  scheduleStart: {
    type: Number,
    required: [true, "Giờ bắt đầu ca làm việc là bắt buộc"],
    min: 0,
    max: 1439 // 23:59 = 1439 phút
  },
  scheduleEnd: {
    type: Number,
    required: [true, "Giờ kết thúc ca làm việc là bắt buộc"],
    min: 0,
    max: 1439 // 23:59 = 1439 phút
  },
  scheduleWeekendStart: {
    type: Number,
    required: [true, "Giờ bắt đầu ca làm việc cuối tuần là bắt buộc"],
    min: 0,
    max: 1439
  },
  scheduleWeekendEnd: {
    type: Number,
    required: [true, "Giờ Kết thúc ca làm việc cuối tuần là bắt buộc"],
    min: 0,
    max: 1439
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
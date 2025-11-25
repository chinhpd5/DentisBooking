import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";  
import { IS_DELETED, SERVICE_STATUS } from "../utils/constants";

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên dịch vụ là bắt buộc"],
    trim: true,
  },
  time: {
    type: Number,
    required: [true, "Thời gian thực hiện dịch vụ là bắt buộc"],
  },
  type: {
    type: String,
    enum: ["job", "trick"],
    default: "job",
  },
  isFirst: {
    type: Boolean,
    default: false,
  },
  jobIds: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service"
    }],
    default: [],
  },
  staffIds:
  {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    }],
    default: [],
  },
  countStaff: {
    type: Number,
    default: 0,
  },
  status: {
    type: Number,
    required: [true, "Trạng thái là bắt buộc"],
    enum: Object.values(SERVICE_STATUS),
    default: SERVICE_STATUS.DISABLED,
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
}, {
  timestamps: true,
  versionKey: false,
});

serviceSchema.plugin(mongoosePaginate);
const Service = mongoose.model("Service", serviceSchema);

export default Service;


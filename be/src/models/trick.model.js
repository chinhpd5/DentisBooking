// import mongoose from "mongoose";
// import mongoosePaginate from "mongoose-paginate-v2";
// import { IS_DELETED, SERVICE_STATUS } from '../utils/constants'

// const trickSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "Thủ thuật là bắt buộc"],
//     trim: true,
//   },
//   time: {
//     type: Number,
//     required: [true, "Thời gian thực hiện thủ thuật là bắt buộc"],
//   },
//   staffIds:
//   {
//     type: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Staff",
//     }],
//     default: [],
//   },
//   jobIds: {
//     type: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Job"
//     }],
//     default: [],
//   },
//   countStaff: {
//     type: Number,
//     required: [true, "Số lượng nhân viên là bắt buộc"]
//   },
//   status: {
//     type: Number,
//     required: [true, "Trạng thái thủ thuật là bắt buộc"],
//     enum: Object.values(SERVICE_STATUS),
//     default: SERVICE_STATUS.ACTIVE,
//     index: true,
//   },

//   description: {
//     type: String,
//     default: "",
//     trim: true,
//   },
//   isDeleted: {
//     type: Number,
//     enum: Object.values(IS_DELETED),
//     default: IS_DELETED.NO,
//   },
//   isFirst: {
//     type: Boolean,
//     default: false,
//   },
// }, {
//   timestamps: true,
//   versionKey: false,
// });

// trickSchema.plugin(mongoosePaginate);
// const Trick = mongoose.model("Trick", trickSchema);

// export default Trick;

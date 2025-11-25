// import mongoose from "mongoose";
// import mongoosePaginate from "mongoose-paginate-v2";  
// import { IS_DELETED, JOB_STATUS } from "../utils/constants";

// const jobSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "Tên công việc là bắt buộc"],
//     trim: true,
//   },
//   time: {
//     type: Number,
//     required: [true, "Thời gian thực hiện công việc là bắt buộc"],
//   },
//   isFrist:{
//     type: Boolean,
//     default: false
//   },
//   description: {
//     type: String,
//     default: "",
//     trim: true,
//   },
//   status: {
//     type: Number,
//     enum: Object.values(JOB_STATUS),
//     default: JOB_STATUS.DISABLED,
//   },
//   isDeleted: {
//     type: Number,
//     enum: Object.values(IS_DELETED),
//     default: IS_DELETED.NO,
//   },
// }, {
//   timestamps: true,
//   versionKey: false,
// });

// jobSchema.plugin(mongoosePaginate);
// const Job = mongoose.model("Job", jobSchema);

// export default Job;
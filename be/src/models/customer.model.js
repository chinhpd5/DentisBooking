import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên khách hàng là bắt buộc"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Số điện thoại khách hàng là bắt buộc"],
  },
  address: {
    type: String,
    required: [true, "Địa chỉ khách hàng là bắt buộc"],
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ["male", "female","other"],
    default: "other",
  },
  note: {
    type: String,
    default: "",
    trim: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

customerSchema.plugin(mongoosePaginate);
const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
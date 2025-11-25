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
  yearOfBirth: {
    type: Number,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const currentYear = new Date().getFullYear();
        return value >= 1900 && value <= (currentYear - 1);
      },
      message: "Năm sinh phải lớn hơn 1 tuổi và hợp lệ"
    }
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
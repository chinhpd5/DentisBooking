import { USER_ROLE, STAFF_STATUS } from "../utils/constants";
import Joi from "joi";

export const createStaffSchema = Joi.object({
  name: Joi.string().required().min(1).max(2000).messages({
    "string.base": "Tên Nhân viên cần kiểu chuỗi",
    "any.required": "Tên Nhân viên là bắt buộc",
    "string.empty": "Tên Nhân viên không được để trống",
    "string.min": "Tên Nhân viên cần tối thiểu {#limit} ký tự",
    "string.max": "Tên Nhân viên cần tối đa {#limit} ký tự"
  }),
  phone: Joi.string().required().min(10).max(10).messages({
    "string.base": "Số điện thoại sản phẩm cần kiểu chuỗi",
    "any.required": "Số điện thoại sản phẩm là bắt buộc",
    "string.empty": "Số điện thoại sản phẩm không được để trống",
    "string.min": "Số điện thoại cần tối thiểu {#limit} ký tự",
    "string.max": "Số điện thoại cần tối đa {#limit} ký tự",
  }),
  email: Joi.string().email().messages({
    "string.base": "Email cần có kiểu chuỗi",
    "string.email": "Sai định dạng email"
  }),
  role: Joi.string().valid(...Object.values(USER_ROLE)).messages({
    "string.base": "Vai trò cần có kiểu dữ liệu chuỗi",
    "any.only": `Chỉ cho phép các giá trị ${Object.values(USER_ROLE).join(", ")}`
  }),
  scheduleStart: Joi.number().required().min(0).max(1439).messages({
    "number.base": "Giờ vào làm ngày thường chưa thỏa mãn",
    "any.required": "Giờ vào làm ngày thường là bắt buộc",
    "number.min": "Giờ vào làm ngày thường tối thiểu từ 0h00p",
    "number.max": "Giờ vào làm ngày thường tối đa từ 23h59p"
  }),
  scheduleEnd: Joi.number().required().min(0).max(1439).messages({
    "number.base": "Giờ ra về ngày thường chưa thỏa mãn",
    "any.required": "Giờ ra về ngày thường là bắt buộc",
    "number.min": "Giờ ra về ngày thường tối thiểu từ 0h00p",
    "number.max": "Giờ ra về ngày thường tối đa từ 23h59p"
  }),
  scheduleWeekendStart: Joi.number().required().min(0).max(1439).messages({
    "number.base": "Giờ vào làm ngày cuối tuần chưa thỏa mãn",
    "any.required": "Giờ vào làm ngày cuối tuần là bắt buộc",
    "number.min": "Giờ vào làm ngày cuối tuần tối thiểu từ 0h00p",
    "number.max": "Giờ vào làm ngày cuối tuần tối đa từ 23h59p"
  }),
  scheduleWeekendEnd: Joi.number().required().min(0).max(1439).messages({
    "number.base": "Giờ ra về ngày cuối tuần chưa thỏa mãn",
    "any.required": "Giờ ra về ngày cuối tuần là bắt buộc",
    "number.min": "Giờ ra về ngày cuối tuần tối thiểu từ 0h00p",
    "number.max": "Giờ ra về ngày cuối tuần tối đa từ 23h59p"
  }),
  status: Joi.string().valid(...Object.values(STAFF_STATUS)).messages({
    "string.base": "Trạng thái cần có kiểu dữ liệu chuỗi",
    "any.only": `Chỉ cho phép các giá trị ${Object.values(STAFF_STATUS).join(", ")}`
  }),
})

export const updateStaffSchema = createStaffSchema.fork(
  ["name","scheduleStart","scheduleEnd","scheduleWeekendStart","scheduleWeekendEnd"],
  (schema) => schema.optional()
)
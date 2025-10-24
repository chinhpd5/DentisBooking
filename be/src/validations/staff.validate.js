import { USER_ROLE, STAFF_STATUS } from "../utils/constants";
import Joi from "joi";

const shiftSchema = Joi.object({
  start: Joi.number()
    .min(0)
    .max(1439)
    .messages({
      "number.base": "Giờ bắt đầu phải là số",
      "number.min": "Giờ bắt đầu tối thiểu là 0 phút (00:00)",
      "number.max": "Giờ bắt đầu tối đa là 1439 phút (23:59)",
    }),
  end: Joi.number()
    .min(0)
    .max(1439)
    .messages({
      "number.base": "Giờ kết thúc phải là số",
      "number.min": "Giờ kết thúc tối thiểu là 0 phút (00:00)",
      "number.max": "Giờ kết thúc tối đa là 1439 phút (23:59)",
    })
});

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
  scheduleMonday: Joi.array()
  .items(shiftSchema)
  .messages({
    "array.base": "scheduleMonday phải là một mảng các ca làm việc",
  }),
  scheduleTuesday: Joi.array()
  .items(shiftSchema)
  .messages({
    "array.base": "scheduleTuesday phải là một mảng các ca làm việc",
  }),
  scheduleWednesday: Joi.array()
  .items(shiftSchema)
  .messages({
    "array.base": "scheduleWednesday phải là một mảng các ca làm việc",
  }),
  scheduleThursday: Joi.array()
  .items(shiftSchema)
  .messages({
    "array.base": "scheduleThursday phải là một mảng các ca làm việc",
  }),
  scheduleFriday: Joi.array()
  .items(shiftSchema)
  .messages({
    "array.base": "scheduleFriday phải là một mảng các ca làm việc",
  }),
  scheduleSaturday: Joi.array()
  .items(shiftSchema)
  .messages({
    "array.base": "scheduleSaturday phải là một mảng các ca làm việc",
  }),
  scheduleSunday: Joi.array()
  .items(shiftSchema)
  .messages({
    "array.base": "scheduleSunday phải là một mảng các ca làm việc",
  }),
  status: Joi.string().valid(...Object.values(STAFF_STATUS)).messages({
    "string.base": "Trạng thái cần có kiểu dữ liệu chuỗi",
    "any.only": `Chỉ cho phép các giá trị ${Object.values(STAFF_STATUS).join(", ")}`
  }),
})

export const updateStaffSchema = createStaffSchema.fork(
  ["name","scheduleMonday","scheduleTuesday","scheduleWednesday","scheduleThursday","scheduleFriday","scheduleSaturday","scheduleSunday"],
  (schema) => schema.optional()
)
import { USER_ROLE, STAFF_STATUS } from "../utils/constants";
import Joi from "joi";

const shiftPartSchema = Joi.object({
  start: Joi.number()
    .min(0)
    .max(1439)
    .optional()
    .messages({
      "number.base": "Giờ bắt đầu phải là số",
      "number.min": "Giờ bắt đầu tối thiểu là 0 phút (00:00)",
      "number.max": "Giờ bắt đầu tối đa là 1439 phút (23:59)",
    }),
  end: Joi.number()
    .min(0)
    .max(1439)
    .optional()
    .messages({
      "number.base": "Giờ kết thúc phải là số",
      "number.min": "Giờ kết thúc tối thiểu là 0 phút (00:00)",
      "number.max": "Giờ kết thúc tối đa là 1439 phút (23:59)",
    })
});

const dayScheduleSchema = Joi.object({
  morning: shiftPartSchema,
  afternoon: shiftPartSchema
}).optional();

export const createStaffSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).messages({
    "string.base": "Tên Nhân viên cần kiểu chuỗi",
    "any.required": "Tên Nhân viên là bắt buộc",
    "string.empty": "Tên Nhân viên không được để trống",
    "string.min": "Tên Nhân viên cần tối thiểu {#limit} ký tự",
    "string.max": "Tên Nhân viên cần tối đa {#limit} ký tự"
  }),
  phone: Joi.string().required().min(10).max(10).messages({
    "string.base": "Số điện thoại cần kiểu chuỗi",
    "any.required": "Số điện thoại là bắt buộc",
    "string.empty": "Số điện thoại không được để trống",
    "string.min": "Số điện thoại cần tối thiểu {#limit} ký tự",
    "string.max": "Số điện thoại cần tối đa {#limit} ký tự",
  }),
  email: Joi.string().email().optional().allow("").messages({
    "string.base": "Email cần có kiểu chuỗi",
    "string.email": "Sai định dạng email"
  }),
  role: Joi.string().valid(...Object.values(USER_ROLE)).optional().messages({
    "string.base": "Vai trò cần có kiểu dữ liệu chuỗi",
    "any.only": `Chỉ cho phép các giá trị ${Object.values(USER_ROLE).join(", ")}`
  }),
  scheduleMonday: dayScheduleSchema,
  scheduleTuesday: dayScheduleSchema,
  scheduleWednesday: dayScheduleSchema,
  scheduleThursday: dayScheduleSchema,
  scheduleFriday: dayScheduleSchema,
  scheduleSaturday: dayScheduleSchema,
  scheduleSunday: dayScheduleSchema,
  status: Joi.number().valid(...Object.values(STAFF_STATUS)).optional().messages({
    "number.base": "Trạng thái cần có kiểu dữ liệu số",
    "any.only": `Chỉ cho phép các giá trị ${Object.values(STAFF_STATUS).join(", ")}`
  }),
})

export const updateStaffSchema = createStaffSchema.fork(
  ["name", "phone"],
  (schema) => schema.optional()
)

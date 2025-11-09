import Joi from "joi";
import { IS_DELETED, SERVICE_STATUS } from "../utils/constants";

export const createServiceSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).messages({
    "string.base": "Tên dịch vụ phải là chuỗi",
    "string.empty": "Tên dịch vụ không được để trống",
    "any.required": "Tên dịch vụ là bắt buộc",
    "string.min": "Tên dịch vụ cần ít nhất {#limit} ký tự",
    "string.max": "Tên dịch vụ tối đa {#limit} ký tự",
  }),
  time: Joi.number().required().messages({
    "number.base": "Thời gian dịch vụ phải là số",
    "any.required": "Thời gian dịch vụ là bắt buộc",
  }),
  type: Joi.string().valid("job", "trick").messages({
    "string.base": "Loại dịch vụ phải là chuỗi",
    "any.only": "Loại dịch vụ chỉ có thể là 'job' hoặc 'trick'",
  }),
  isFirst: Joi.boolean().messages({
    "boolean.base": "isFirst phải là boolean",
  }),
  jobIds: Joi.array().items(Joi.string()).messages({
    "array.base": "Danh sách jobIds phải là mảng",
  }),
  staffIds: Joi.array().items(Joi.string()).messages({
    "array.base": "Danh sách staffIds phải là mảng",
  }),
  countStaff: Joi.number().when("type", {
    is: "trick",
    then: Joi.required().messages({
      "any.required": "Số lượng nhân viên là bắt buộc khi loại là 'trick'",
    }),
    otherwise: Joi.optional(),
  }),
  description: Joi.string().allow("").max(1000).messages({
    "string.base": "Mô tả phải là chuỗi",
    "string.max": "Mô tả tối đa {#limit} ký tự",
  }),
  status: Joi.number().valid(...Object.values(SERVICE_STATUS)).messages({
    "number.base": "Trạng thái dịch vụ phải là số",
    "any.only": `Chỉ chấp nhận các giá trị: ${Object.values(SERVICE_STATUS).join(", ")}`,
  }),
  isDeleted: Joi.number().valid(...Object.values(IS_DELETED)).messages({
    "number.base": "Trạng thái isDeleted phải là số",
    "any.only": `Chỉ chấp nhận các giá trị: ${Object.values(IS_DELETED).join(", ")}`,
  }),
});

export const updateServiceSchema = createServiceSchema.fork(
  ["name", "time", "type", "isFirst", "jobIds", "staffIds", "countStaff", "description", "status"],
  (schema) => schema.optional()
);

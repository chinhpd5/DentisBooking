import Joi from "joi";
import { IS_DELETED, SERVICE_STATUS } from "../utils/constants";

export const createTrickSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).messages({
    "string.base": "Tên thủ thuật phải là chuỗi",
    "string.empty": "Tên thủ thuật không được để trống",
    "any.required": "Tên thủ thuật là bắt buộc",
    "string.min": "Tên thủ thuật cần ít nhất {#limit} ký tự",
    "string.max": "Tên thủ thuật tối đa {#limit} ký tự",
  }),
  time: Joi.number().required().messages({
    "number.base": "Thời gian thủ thuật phải là số",
    "any.required": "Thời gian thủ thuật là bắt buộc",
  }),
  type: Joi.string().valid("job", "trick").messages({
    "string.base": "Loại thủ thuật phải là chuỗi",
    "any.only": "Loại thủ thuật chỉ có thể là 'job' hoặc 'trick'",
  }),
  staffIds: Joi.array().items(Joi.string()).messages({
    "array.base": "Danh sách staffIds phải là mảng",
    "string.base": "Mỗi staffIds phải là chuỗi (ObjectId)",
  }),
  jobIds: Joi.array().items(Joi.string()).messages({
    "array.base": "Danh sách jobIds phải là mảng",
    "string.base": "Mỗi jobId phải là chuỗi (ObjectId)",
  }),
  countStaff: Joi.number().required().messages({
    "number.base": "Số lượng nhân viên phải là số",
    "any.required": "Số lượng nhân viên là bắt buộc",
  }),
  description: Joi.string().allow("").max(1000).messages({
    "string.base": "Mô tả phải là chuỗi",
    "string.max": "Mô tả tối đa {#limit} ký tự",
  }),
  status: Joi.number().valid(...Object.values(SERVICE_STATUS)).messages({
    "number.base": "Trạng thái thủ thuật phải là số",
    "any.only": `Chỉ chấp nhận các giá trị: ${Object.values(SERVICE_STATUS).join(", ")}`,
  }),
  isDeleted: Joi.number().valid(...Object.values(IS_DELETED)).messages({
    "number.base": "Trạng thái isDeleted phải là số",
    "any.only": `Chỉ chấp nhận các giá trị: ${Object.values(IS_DELETED).join(", ")}`,
  }),
});

export const updateTrickSchema = createTrickSchema.fork(
  ["name", "time", "type", "staffIds", "jobIds", "countStaff", "description", "status"],
  (schema) => schema.optional()
);
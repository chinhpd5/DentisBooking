import Joi from "joi";
import { IS_DELETED, JOB_STATUS } from "../utils/constants";

export const createJobSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).messages({
    "string.base": "Tên công việc phải là chuỗi",
    "string.empty": "Tên công việc không được để trống",
    "any.required": "Tên công việc là bắt buộc",
    "string.min": "Tên công việc cần ít nhất {#limit} ký tự",
    "string.max": "Tên công việc tối đa {#limit} ký tự",
  }),
  time: Joi.number().required().messages({
    "number.base": "Thời gian công việc phải là số",
    "any.required": "Thời gian công việc là bắt buộc",
  }),
  isFrist: Joi.boolean().default(false).messages({
    "boolean.base": "isFrist phải là boolean",
  }),
  description: Joi.string().allow("").max(1000).messages({
    "string.base": "Mô tả phải là chuỗi",
    "string.max": "Mô tả tối đa {#limit} ký tự",
  }),
  status: Joi.number().valid(...Object.values(JOB_STATUS)).messages({
    "number.base": "Trạng thái công việc phải là số",
    "any.only": `Chỉ chấp nhận các giá trị: ${Object.values(JOB_STATUS).join(", ")}`,
  }),
  isDeleted: Joi.number().valid(...Object.values(IS_DELETED)).messages({
    "number.base": "Trạng thái isDeleted phải là số",
    "any.only": `Chỉ chấp nhận các giá trị: ${Object.values(IS_DELETED).join(", ")}`,
  }),
});

export const updateJobSchema = createJobSchema.fork(
  ["name", "time", "isFrist", "description", "status"],
  (schema) => schema.optional()
);

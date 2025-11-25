import Joi from "joi";
import { IS_DELETED, SEAT_STATUS } from "../utils/constants.js";

export const createSeatSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    "string.base": "Tên ghế phải là chuỗi",
    "string.empty": "Tên ghế không được để trống",
    "any.required": "Tên ghế là bắt buộc",
    "string.min": "Tên ghế cần ít nhất {#limit} ký tự",
    "string.max": "Tên ghế tối đa {#limit} ký tự",
  }),

  locationId: Joi.string().messages({
    "string.base": "ID vị trí phải là chuỗi",
    "string.empty": "ID vị trí không được để trống",
  }),

  status: Joi.number().valid(...Object.values(SEAT_STATUS)).messages({
    "number.base": "Trạng thái phải là số",
    "any.only": `Chỉ chấp nhận các giá trị: ${Object.values(SEAT_STATUS).join(", ")}`,
  }),

  description: Joi.string().allow("").max(500).messages({
    "string.base": "Mô tả phải là chuỗi",
    "string.max": "Mô tả tối đa {#limit} ký tự",
  }),
  isDeleted: Joi.number().valid(...Object.values(IS_DELETED)).messages({
    "number.base": "Trạng thái isDeleted phải là số",
    "any.only": `Chỉ chấp nhận các giá trị: ${Object.values(IS_DELETED).join(", ")}`,
  }),
});

// 🟡 Schema cập nhật ghế (có thể bỏ qua 1 số trường)
export const updateSeatSchema = createSeatSchema.fork(
  ["name", "locationId", "status", "description"],
  (schema) => schema.optional()
);

import Joi from "joi";

export const createLocationSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).messages({
    "string.base": "Tên địa điểm phải là chuỗi",
    "string.empty": "Tên địa điểm không được để trống",
    "any.required": "Tên địa điểm là bắt buộc",
    "string.min": "Tên địa điểm cần ít nhất {#limit} ký tự",
    "string.max": "Tên địa điểm tối đa {#limit} ký tự",
  }),

  description: Joi.string().allow("").max(1000).messages({
    "string.base": "Mô tả phải là chuỗi",
    "string.max": "Mô tả tối đa {#limit} ký tự",
  }),
});

export const updateLocationSchema = createLocationSchema.fork(
  ["name", "description"],
  (schema) => schema.optional()
);

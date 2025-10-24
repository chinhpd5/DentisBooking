import Joi from "joi";

export const createCustomerSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).messages({
    "string.base": "Tên khách hàng phải là chuỗi",
    "string.empty": "Tên khách hàng không được để trống",
    "any.required": "Tên khách hàng là bắt buộc",
    "string.min": "Tên khách hàng cần ít nhất {#limit} ký tự",
    "string.max": "Tên khách hàng tối đa {#limit} ký tự",
  }),

  phone: Joi.string().required().min(10).max(10).pattern(/^[0-9]+$/).messages({
    "string.base": "Số điện thoại phải là chuỗi",
    "string.empty": "Số điện thoại không được để trống",
    "any.required": "Số điện thoại là bắt buộc",
    "string.min": "Số điện thoại phải đủ {#limit} số",
    "string.max": "Số điện thoại không vượt quá {#limit} số",
    "string.pattern.base": "Số điện thoại chỉ được chứa số",
  }),

  address: Joi.string().required().min(5).max(300).messages({
    "string.base": "Địa chỉ phải là chuỗi",
    "string.empty": "Địa chỉ không được để trống",
    "any.required": "Địa chỉ là bắt buộc",
    "string.min": "Địa chỉ cần ít nhất {#limit} ký tự",
    "string.max": "Địa chỉ tối đa {#limit} ký tự",
  }),
});

export const updateCustomerSchema = createCustomerSchema.fork(
  ["name", "phone", "address"],
  (schema) => schema.optional()
);

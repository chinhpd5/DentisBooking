import Joi from 'joi'
import { USER_ROLE, USER_STATUS } from '../utils/constants'

export const registerSchema = {
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.base": "Tên đăng nhập cần kiểu chuỗi",
    "string.alphanum": "Tên đăng nhập chỉ được chứa chữ và số",
    "string.min": "Tên đăng nhập cần ít nhất {#limit} ký tự",
    "string.max": "Tên đăng nhập không được vượt quá {#limit} ký tự",
    "any.required": "Tên đăng nhập là bắt buộc",
  }),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{6,30}$')).required().messages({
    "string.pattern.base": "Mật khẩu cần từ 6 đến 30 ký tự và chỉ chứa chữ và số",
    "any.required": "Mật khẩu là bắt buộc",
  }),
  email: Joi.string().email().messages({
    "string.email": "Email không hợp lệ",
  }),
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Tên cần kiểu chuỗi",
    "string.min": "Tên cần ít nhất {#limit} ký tự",
    "string.max": "Tên không được vượt quá {#limit} ký tự",
    "any.required": "Tên là bắt buộc",
  }),
  role: Joi.string().valid(...Object.values(USER_ROLE)).messages({
    "any.only": `Vai trò phải là ${Object.values(USER_ROLE).join(" hoặc ")}`,
  }),
  status: Joi.string().valid(...Object.values(USER_STATUS)).messages({
    "any.only": `Trạng thái phải là ${Object.values(USER_STATUS).join(" hoặc ")}`,
  })
};

export const loginSchema = {
  username: Joi.string().required().messages({
    "any.required": "Tên đăng nhập là bắt buộc",
  }),
  password: Joi.string().required().min(6).messages({
    "any.required": "Mật khẩu là bắt buộc",
    "string.min": "Mật khẩu cần ít nhất {#limit} ký tự",
  }),
};

export const changePasswordSchema = {
  oldPassword: Joi.string().required().messages({
    "any.required": "Mật khẩu cũ là bắt buộc",
  }),
  newPassword: Joi.string().required().min(6).messages({
    "any.required": "Mật khẩu mới là bắt buộc",
    "string.min": "Mật khẩu mới cần ít nhất {#limit} ký tự",
  }),
};
export const resetPasswordSchema = {
  id: Joi.string().required().messages({
    "any.required": "ID người dùng là bắt buộc",
  })
};
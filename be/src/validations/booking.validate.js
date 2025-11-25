import Joi from "joi";
import { BOOKING_STATUS, IS_DELETED, SERVICE_TYPE } from "../utils/constants";

const objectId = Joi.string().hex().length(24);

export const createBookingSchema = Joi.object({
  customerId: objectId.required().messages({
    "any.required": "Khách hàng là bắt buộc",
    "string.length": "customerId không hợp lệ",
  }),
  note: Joi.string().allow("").max(1000),
  appointmentDate: Joi.date().required().messages({
    "any.required": "Ngày hẹn là bắt buộc",
  }),
  timeEnd: Joi.date().required().messages({
    "any.required": "Thời gian kết thúc là bắt buộc",
  }),
  doctorDate: Joi.date().optional(),
  priority: Joi.boolean().required().messages({
    "any.required": "Ưu tiên là bắt buộc",
  }),
  type: Joi.string().valid(...Object.values(SERVICE_TYPE)).optional(),
  comingTime: Joi.date().optional(),
  doingTime: Joi.date().optional(),
  completeTime: Joi.date().optional(),
  doctorId: objectId.optional(),
  serviceId: objectId.required().messages({
    "any.required": "Dịch vụ là bắt buộc",
  }),
  status: Joi.string().valid(...Object.values(BOOKING_STATUS)).optional(),
  isDeleted: Joi.number().valid(...Object.values(IS_DELETED)).optional(),
  staffAssignments: Joi.array().items(Joi.object({
    staffId: objectId.required(),
    serviceIds: Joi.array().items(objectId).optional(),
    timeStart: Joi.date().required(),
    timeEnd: Joi.date().required(),
  })).optional(),
});

export const updateBookingSchema = createBookingSchema.fork(
  [
    "customerId",
    "note",
    "appointmentDate",
    "timeEnd",
    "doctorDate",
    "priority",
    "comingTime",
    "doingTime",
    "completeTime",
    "doctorId",
    "serviceId",
    "status",
    "isDeleted",
    "staffAssignments",
  ],
  (schema) => schema.optional()
);

export const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(BOOKING_STATUS)).required().messages({
    "any.required": "Trạng thái là bắt buộc",
  }),
  comingTime: Joi.date().optional(),
  doingTime: Joi.date().optional(),
  completeTime: Joi.date().optional(),
  cancellationReason: Joi.string().when('status', {
    is: Joi.string().valid(BOOKING_STATUS.CANCELLED),
    then: Joi.string().required().messages({
      "any.required": "Lý do hủy là bắt buộc khi trạng thái là Hủy",
    }),
    otherwise: Joi.string().allow("").optional(),
  }),
});

export const modifyBookingStaffSchema = Joi.object({
  staffId: objectId.required().messages({
    "any.required": "Nhân sự là bắt buộc",
  }),
  serviceIds: Joi.array().items(objectId).optional(),
  timeStart: Joi.date().optional(),
  timeEnd: Joi.date().optional(),
});



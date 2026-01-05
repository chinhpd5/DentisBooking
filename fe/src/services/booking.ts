import { BOOKING_STATUS } from "../contants";
import axiosInstance from "./axiosInstance";

export interface CreateBooking {
  customerId: string;
  note?: string;
  appointmentDate: Date;
  timeEnd: Date;
  doctorDate?: Date;
  priority: boolean;
  doctorId?: string;
  serviceId: string;
  type?: string;
  KS?: boolean;
}

export const addBooking = (data: CreateBooking) => 
  axiosInstance.post("/booking", data);

export const getListBooking = async (
  search?: string,
  status?: BOOKING_STATUS,
  doctorId?: string,
  staffId?: string,
  fromDate?: string,
  toDate?: string
) => {
  let query = `booking?`;
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (doctorId) params.append('doctorId', doctorId);
  if (staffId) params.append('staffId', staffId);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  query += params.toString();
  const { data } = await axiosInstance.get(query);
  return data;
};

export const getBookingById = async (id: string) => {
  const { data } = await axiosInstance.get(`booking/${id}`);
  return data.data;
};

export const updateBooking = (id: string, data: Partial<CreateBooking>) =>
  axiosInstance.put(`/booking/${id}`, data);

export const deleteBooking = (id: string) =>
  axiosInstance.delete(`/booking/${id}`);

export const updateBookingStatus = (id: string, status: BOOKING_STATUS, comingTime?: Date, doingTime?: Date, completeTime?: Date, cancellationReason?: string) => {
  const payload: { status: BOOKING_STATUS; comingTime?: Date; doingTime?: Date; completeTime?: Date; cancellationReason?: string } = { status };
  if (comingTime) payload.comingTime = comingTime;
  if (doingTime) payload.doingTime = doingTime;
  if (completeTime) payload.completeTime = completeTime;
  if (cancellationReason !== undefined) payload.cancellationReason = cancellationReason;
  return axiosInstance.patch(`/booking/${id}/status`, payload);
};

export const getTodaySchedule = async (date?: string, staffId?: string, role?: string) => {
  let query = "/booking/today";
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (staffId) params.append("staffId", staffId);
  if (role) params.append("role", role);
  if (params.toString()) query += `?${params.toString()}`;
  const { data } = await axiosInstance.get(query);
  return data.data;
};


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
}

export const addBooking = (data: CreateBooking) => 
  axiosInstance.post("/booking", data);

export const getListBooking = async (
  page: number,
  limit: number,
  search?: string,
  status?: BOOKING_STATUS,
  doctorId?: string,
  staffId?: string,
  fromDate?: string,
  toDate?: string
) => {
  let query = `booking?page=${page}&limit=${limit}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (status) query += `&status=${status}`;
  if (doctorId) query += `&doctorId=${doctorId}`;
  if (staffId) query += `&staffId=${staffId}`;
  if (fromDate) query += `&fromDate=${fromDate}`;
  if (toDate) query += `&toDate=${toDate}`;
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

export const updateBookingStatus = (id: string, status: BOOKING_STATUS, comingTime?: Date, doingTime?: Date, completeTime?: Date) => {
  const payload: { status: BOOKING_STATUS; comingTime?: Date; doingTime?: Date; completeTime?: Date } = { status };
  if (comingTime) payload.comingTime = comingTime;
  if (doingTime) payload.doingTime = doingTime;
  if (completeTime) payload.completeTime = completeTime;
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


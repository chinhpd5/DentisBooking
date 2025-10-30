import { CreateSeat } from "../types/seat";
import axiosInstance from "./axiosInstance";

export const addSeat = (data: CreateSeat) => 
  axiosInstance.post("/seat", data);

export const getListSeat = async (page: number = 1, limit: number = 10, search?: string, status?: number, location?: string) => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  if (status !== undefined) params.status = status;
  if (location) params.location = location;
  
  const { data } = await axiosInstance.get("/seat", { params });
  return data;
};

export const getSeatById = (id: string) => 
  axiosInstance.get(`/seat/${id}`).then(res => res.data.data);

export const updateSeat = (id: string, data: Partial<CreateSeat>) => 
  axiosInstance.put(`/seat/${id}`, data);

export const deleteSeat = (id: string) => 
  axiosInstance.delete(`/seat/${id}`);

export const updateSeatStatus = (id: string, status: number) =>
  axiosInstance.patch(`/seat/${id}/status`, { status });


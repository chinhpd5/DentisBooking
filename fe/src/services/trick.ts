import { CreateTrick } from "../types/trick";
import axiosInstance from "./axiosInstance";

export const addTrick = (data: CreateTrick) => {
  return axiosInstance.post("/trick", data);
};

export const getListTrick = async (
  currentPage: number,
  pageSize: number,
  search: string | undefined,
  status: number | undefined,
) => {
  let api = `/trick?page=${currentPage}&limit=${pageSize}`;
  if (search) api += `&search=${search}`;
  if (status !== undefined) api += `&status=${status}`;
  const { data } = await axiosInstance.get(api);
  return data;
};

export const getTrickById = async (id: string) => {
  const { data } = await axiosInstance.get(`trick/${id}`);
  return data.data;
};

export const updateTrick = (id: string, data: Partial<CreateTrick>) => {
  return axiosInstance.put(`/trick/${id}`, data);
};

export const deleteTrick = (id: string) => {
  return axiosInstance.delete(`/trick/${id}`);
};

export const getAllTrick = async () => {
  const { data } = await axiosInstance.get(`trick/all`);
  return data.data;
};

import { SERVICE_STATUS } from "../contants";
import axiosInstance from "./axiosInstance";

export const getAllService = async (status?: SERVICE_STATUS) => {
  let query = `/service/all`;
  if (status) query += `&status=${status}`;
  const { data } = await axiosInstance.get(query);
  return data.data;
};

export const getListService = async (page: number, limit: number, search?: string, status?: SERVICE_STATUS) => {
  let query = `/service?page=${page}&limit=${limit}`;
  if (search) query += `&search=${search}`;
  if (status) query += `&status=${status}`;
  const { data } = await axiosInstance.get(query);
  return data.data;
};

export const getServiceById = async (id: string) => {
  const { data } = await axiosInstance.get(`service/${id}`);
  console.log(data.data);
  return data.data;
};

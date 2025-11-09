import { CreateCustomer } from "../types/customer";
import axiosInstance from "./axiosInstance";

export const getListCustomer = async (page: number, limit: number, search: string | undefined) => {
  let query = `customer?page=${page}&limit=${limit}`;
  if (search && search.trim()) {
    query += `&search=${encodeURIComponent(search.trim())}`;
  }
  const { data } = await axiosInstance.get(query);
  return data;
};

export const getCustomerById = (id: string) => 
  axiosInstance.get(`/customer/${id}`).then(res => res.data.data);

export const addCustomer = (data: CreateCustomer) => 
  axiosInstance.post("/customer", data);

export const updateCustomer = (id: string, data: Partial<CreateCustomer>) => 
  axiosInstance.put(`/customer/${id}`, data);

export const deleteCustomer = (id: string) => 
  axiosInstance.delete(`/customer/${id}`);

export const getCustomerByPhone = async (phone: string) => {
  const { data } = await axiosInstance.get(`/customer/phone/${phone}`);
  return data.data;
};


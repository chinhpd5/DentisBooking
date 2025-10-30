import { CreateStaff } from "../types/staff"
import axiosInstance from "./axiosInstance"

export const addStaff = (data: CreateStaff) => {
  return axiosInstance.post("/staff", data);
}

export const getListStaff = async (currentPage: number,pageSize: number, search: string|undefined, role: string|undefined, status: number|undefined) => {
  let api = `staff?page=${currentPage}&limit=${pageSize}`
  if(search)
    api+=`&search=${search}`;
  if(role)
    api+= `&role=${role}`
  if(status !== undefined)
    api+=`&status=${status}`
  const {data} = await axiosInstance.get(api);
  return data
}  

export const getStaffById = async (id: string) => {
  const {data} = await axiosInstance.get(`staff/${id}`)
  return data.data
}

export const updateStaff = (id: string, data: CreateStaff) => {
  return axiosInstance.put(`/staff/${id}`, data);
}

export const deleteStaff = (id: string) => {
  return axiosInstance.delete(`/staff/${id}`);
}

export const getAllStaff = async (role: string | undefined) => {
  let api = "/staff/all";
  if(role)
    api+=`?role=${role}`;
  const {data} = await axiosInstance.get(api);
  return data.data;
}
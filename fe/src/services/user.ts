import { USER_ROLE, USER_STATUS } from "../contants";
import { CreateUser, Login } from "../types/user";
import axiosInstance from "./axiosInstance";

export const login = (data: Login) => {
    return axiosInstance.post("/auth/login", data);
}

export const addUser = (data: CreateUser) => axiosInstance.post("/auth/register", data);

export const getListUser = async (page: number, limit: number, search: string|undefined, role: USER_ROLE | undefined, status: USER_STATUS | undefined) => {
  let query = `user?page=${page}&limit=${limit}`;
  if (search) query += `&search=${search}`;
  if (role) query += `&role=${role}`;
  if (status !== undefined) query += `&active=${status}`;
  const { data } = await axiosInstance.get(query);
  return data;
};
export const getUserById = (id: string) => axiosInstance.get(`/user/${id}`).then(res => res.data.data);
export const updateUser = (id: string, data: Partial<CreateUser>) => axiosInstance.put(`/user/${id}`, data);
export const deleteUser = (id: string) => axiosInstance.delete(`/user/${id}`);



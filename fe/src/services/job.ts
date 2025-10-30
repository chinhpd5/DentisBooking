import { CreateJob } from "../types/job";
import axiosInstance from "./axiosInstance";

export const addJob = (data: CreateJob) => {
  return axiosInstance.post("/job", data);
};

export const getListJob = async (
  currentPage: number,
  pageSize: number,
  search: string | undefined,
  status: number | undefined
) => {
  let api = `job?page=${currentPage}&limit=${pageSize}`;
  if (search) api += `&search=${search}`;
  if (status !== undefined) api += `&status=${status}`;
  const { data } = await axiosInstance.get(api);
  return data;
};

export const getJobById = async (id: string) => {
  const { data } = await axiosInstance.get(`job/${id}`);
  return data.data;
};

export const updateJob = (id: string, data: Partial<CreateJob>) => {
  return axiosInstance.put(`/job/${id}`, data);
};

export const deleteJob = (id: string) => {
  return axiosInstance.delete(`/job/${id}`);
};

export const getJobIsFirst = async () => {
  const { data } = await axiosInstance.get(`job/first`);
  return data.data;
};

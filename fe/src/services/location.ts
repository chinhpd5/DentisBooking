import { CreateLocation } from "../types/location";
import axiosInstance from "./axiosInstance";

export const addLocation = (data: CreateLocation) => 
  axiosInstance.post("/location", data);

export const getListLocation = async () => {
  const { data } = await axiosInstance.get("/location");
  return data;
};

export const getLocationById = (id: string) => 
  axiosInstance.get(`/location/${id}`).then(res => res.data.data);

export const updateLocation = (id: string, data: Partial<CreateLocation>) => 
  axiosInstance.put(`/location/${id}`, data);

export const deleteLocation = (id: string) => 
  axiosInstance.delete(`/location/${id}`);


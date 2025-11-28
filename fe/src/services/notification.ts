import axiosInstance from "./axiosInstance";

export const getNotifications = async (page: number = 1, limit: number = 20) => {
  const params = { page, limit };
  const { data } = await axiosInstance.get("/notification", { params });
  return data;
};


import { Login } from "../types/user";
import axiosInstance from "./axiosInstance";

export const login = (data: Login) => {
    return axiosInstance.post("/auth/login", data);
}
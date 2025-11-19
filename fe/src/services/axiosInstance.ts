import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("tokenDentis");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Đã xảy ra lỗi";

    switch (status) {
      case 400:
        console.log(error);
        
        toast.error(error.response?.data?.message  || "Dữ liệu không hợp lệ");
        break;

      case 401:
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("tokenDentis");
        window.location.href = "/login";
        break;

      case 403:
        console.log(error);
        
        toast.error(error.response?.data?.message ||"Bạn không có quyền truy cập chức năng này123.");
        // window.location.href = "/unauthorized";
        break;

      case 404:
        toast.error("Không tìm thấy dữ liệu.");
        window.location.href = "/not-found";
        break;

      case 500:
        toast.error(error.response?.data?.message || "Lỗi server. Vui lòng thử lại sau.");
        break;

      default:
        toast.error(message);
        break;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
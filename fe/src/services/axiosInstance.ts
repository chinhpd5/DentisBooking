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
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Đã xảy ra lỗi";

    switch (status) {
      case 400:
        toast.error(message || "Dữ liệu không hợp lệ");
        break;

      case 401:
        localStorage.removeItem("tokenDentis");
        window.location.href = "/login";
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        break;

      case 403:
        toast.error("Bạn không có quyền truy cập chức năng này.");
        window.location.href = "/unauthorized";
        break;

      case 404:
        toast.error("Không tìm thấy dữ liệu.");
        window.location.href = "/not-found";
        break;

      case 500:
        toast.error("Lỗi server. Vui lòng thử lại sau.");
        break;

      default:
        toast.error(message);
        break;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
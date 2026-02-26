import axios from "axios";
import { store } from "@/redux/store";
import { setAccessToken, logoutSuccess } from "@/redux/authSlice";

const BASE_URL = "http://deploydemocliquebe-production.up.railway.app:4000";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // tự động gửi cookie refreshToken
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: gắn Bearer token từ Redux store ──────
axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth?.login?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: tự động refresh token khi 401 ───────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response.data, // ✅ unwrap .data tự động
  async (error) => {
    const originalRequest = error.config;

    // Nếu 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Đang refresh → đưa vào hàng đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh token (cookie tự gửi nhờ withCredentials)
        const data = await axios.post(
          `${BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true },
        );

        const newToken = data.data.access_token;

        // Lưu access token mới vào Redux (redux-persist sẽ sync ra localStorage)
        store.dispatch(setAccessToken(newToken));

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại → logout
        processQueue(refreshError, null);
        store.dispatch(logoutSuccess());
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);

export default axiosInstance;

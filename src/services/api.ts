/**
 * api.ts — tất cả API functions đều dùng axiosInstance
 * đã có: request interceptor (gắn Bearer token từ Redux)
 *         response interceptor (auto refresh khi 401, logout khi refresh thất bại)
 */
import axiosInstance from "@/utils/axiosInstance";

// ─── AUTH ────────────────────────────────────────────────────

/** Bước 1 đăng ký: gửi OTP về email */
export const sendRegisterOTP = (data: {
  name: string;
  age: number;
  gender: string;
  bio?: string;
  email: string;
  password: string;
  confirm_password: string;
}) => axiosInstance.post("/users/send-otp-register", data);

/** Bước 2 đăng ký: xác thực OTP → tạo tài khoản */
export const verifyRegisterOTP = (data: {
  name: string;
  age: number;
  gender: string;
  bio?: string;
  email: string;
  password: string;
  confirm_password: string;
  otp: string;
}) => axiosInstance.post("/users/verify-otp-register", data);

/** Đăng nhập */
export const login = (data: { email: string; password: string }) =>
  axiosInstance.post("/users/login", data);

/** Đăng xuất */
export const logout = () => axiosInstance.post("/users/logout");

/** Làm mới access token bằng refresh token cookie */
export const refreshToken = () => axiosInstance.post("/users/refresh-token");

/** Lấy thông tin bản thân */
export const getMe = () => axiosInstance.get("/users/me");

/** Cập nhật profile */
export const updateProfile = (data: {
  name?: string;
  age?: number;
  gender?: string;
  bio?: string;
  avatar?: string;
}) => axiosInstance.put("/users/update-profile", data);

/** Lấy chữ ký upload Cloudinary */
export const getUploadSignature = () =>
  axiosInstance.get("/users/upload-signature");

// ─── DATING — PROFILES ───────────────────────────────────────

/** Danh sách tất cả profile (trừ mình) */
export const getProfiles = () => axiosInstance.get("/dating/users");

/** Xem profile chi tiết của 1 người theo id */
export const getProfile = (id: string) =>
  axiosInstance.get(`/dating/users/${id}`);

// ─── DATING — LIKE / UNLIKE ──────────────────────────────────

/** Tym một người (POST /dating/users/:id/like) */
export const likeUser = (targetId: string) =>
  axiosInstance.post(`/dating/users/${targetId}/like`);

/** Bỏ tym (DELETE /dating/users/:id/like) */
export const unlikeUser = (targetId: string) =>
  axiosInstance.delete(`/dating/users/${targetId}/like`);

// ─── DATING — MATCHES ────────────────────────────────────────

/** Danh sách match của mình */
export const getMatches = () => axiosInstance.get("/dating/users/matches");

/** Danh sách người đã tym mình */
export const getLikedMe = () => axiosInstance.get("/dating/users/liked-me");

// ─── DATING — POSTS ──────────────────────────────────────────

/** Tạo post mới (content + image URL) */
export const createPost = (data: { content?: string; image?: string }) =>
  axiosInstance.post("/dating/posts", data);

/** Lấy posts — không truyền userId → lấy của mình, truyền → lấy của người đó */
export const getPosts = (userId?: string) =>
  axiosInstance.get("/dating/posts", { params: userId ? { userId } : {} });

/** Lấy feed bảng tin trang chủ (các post chưa xem) */
export const getFeed = () => axiosInstance.get("/dating/posts/feed");

/** Đánh dấu một bài viết là đã xem */
export const markPostAsSeen = (postId: string) =>
  axiosInstance.post(`/dating/posts/${postId}/seen`);

/** Lấy lịch sử thông báo Realtime */
export const getNotifications = () =>
  axiosInstance.get("/dating/notifications");

// ─── DATE SCHEDULING ──────────────────────────────────────────

/** Gửi danh sách thời gian rảnh cho một người (targetUserId) */
export const submitAvailability = (targetUserId: string, slots: any[]) =>
  axiosInstance.post("/dating/schedule/availability", { targetUserId, slots });

/** Xác nhận chốt lịch chung (kể cả khi có warning) */
export const confirmAppointment = (data: {
  targetUserId: string;
  date: string;
  startTime: string;
  endTime: string;
}) => axiosInstance.post("/dating/schedule/confirm", data);

/** Lấy danh sách lịch hẹn hò đã duyệt */
export const getAppointments = () =>
  axiosInstance.get("/dating/schedule/appointments");

/** Lấy trạng thái của Date Scheduling (chưa gửi, chờ đối phương, hoặc đã chốt) */
export const getScheduleStatus = (targetUserId: string) =>
  axiosInstance.get(`/dating/schedule/status/${targetUserId}`);

export default axiosInstance;

import Constants from "expo-constants";
import axios, { AxiosError } from "axios";

// Get the Metro server URL at runtime based on the bundle's origin.
export const getMetroServerUrl = (): string | null => {
  const expUrl = Constants.experienceUrl;
  if (expUrl) {
    try {
      const cleaned = expUrl.trim();
      if (cleaned.startsWith("exps://")) {
        return "https://" + cleaned.substring(7).split("/")[0].split("?")[0];
      } else if (cleaned.startsWith("exp://")) {
        return "http://" + cleaned.substring(6).split("/")[0].split("?")[0];
      } else if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
        const parts = cleaned.split("/");
        return parts[0] + "//" + parts[2];
      }
    } catch (e) {
      console.warn("[API] Error parsing experienceUrl:", e);
    }
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const protocol = hostUri.includes("trycloudflare.com") || hostUri.includes("ngrok") ? "https:" : "http:";
    return `${protocol}//${hostUri.split("/")[0].split("?")[0]}`;
  }

  return null;
};

let cachedApiUrl: string | null = null;

export const getApiBaseUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;

  // 1. In development, try to fetch the live URL from the Metro dev server
  const metroUrl = getMetroServerUrl();
  if (metroUrl) {
    try {
      const response = await axios.get<{ apiUrl?: string }>(`${metroUrl}/api-url`, { timeout: 2000 });
      const url = response.data?.apiUrl;
      if (url) {
        console.log("[API] Resolved live API URL from Metro server:", url);
        cachedApiUrl = url;
        return url;
      }
    } catch (e) {
      console.log("[API] Could not fetch live API URL from Metro server, using fallback:", e);
    }
  }

  // 2. Fallback to the environment variable (build-time env)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    const val = envUrl.replace(/\/$/, "");
    cachedApiUrl = val;
    return val;
  }

  // 3. Last resort fallback
  const fallback = "http://192.168.2.108:8011";
  cachedApiUrl = fallback;
  return fallback;
};

// We initialize API_BASE_URL synchronously for fallback/default use, 
// but it will be updated dynamically on any request by the interceptor.
export let API_BASE_URL = process.env.EXPO_PUBLIC_API_URL 
  ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "") 
  : "http://192.168.2.108:8011";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true" 
  },
});

// Dynamic baseURL resolution interceptor
api.interceptors.request.use(async (config) => {
  try {
    const resolvedUrl = await getApiBaseUrl();
    config.baseURL = resolvedUrl;
    API_BASE_URL = resolvedUrl; // sync global let
  } catch (err) {
    console.error("[API] Error resolving dynamic base URL:", err);
  }
  return config;
});

export function setAuthToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    if (error.code === "ECONNABORTED")
      return Promise.reject(new Error("Request timed out — check your connection"));
    if (!error.response) {
      const urlFailed = error.config?.baseURL || API_BASE_URL;
      return Promise.reject(new Error(`Cannot connect to server at ${urlFailed}`));
    }
    const msg = error.response.data?.error || error.response.data?.message || error.message;
    return Promise.reject(new Error(msg));
  }
);

// --- Auth ---
export const login = (email: string, password: string) =>
  api.post("/api/auth/login", { email, password }).then((r) => r.data);
export const getMe = () => api.get("/api/auth/me").then((r) => r.data);
export const checkHealth = async (): Promise<boolean> => {
  try { return (await api.get("/health", { timeout: 5000 })).data?.ok === true; }
  catch { return false; }
};

// --- Dashboard ---
export const getDashboard = () => api.get("/api/dashboard/summary").then((r) => r.data);

// --- Students ---
export const getStudents = () => api.get("/api/students").then((r) => r.data);
export const getStudent = (id: string) => api.get(`/api/students/${id}`).then((r) => r.data);
export const getLeaderboard = (classroomId?: string) => api.get("/api/students/leaderboard", { params: classroomId ? { classroomId } : {} }).then((r) => r.data);

// --- Attendance ---
export const getAttendance = (params?: { studentId?: string; date?: string; classroomId?: string }) =>
  api.get("/api/attendance", { params }).then((r) => r.data);
export const markAttendance = (records: { studentId: string; status: string; note?: string }[]) =>
  api.post("/api/attendance", { records }).then((r) => r.data);
export const getTodayAttendance = (classroomId: string) =>
  api.get(`/api/attendance/today/${classroomId}`).then((r) => r.data);

// --- Fees ---
export const getFees = (status?: string) =>
  api.get("/api/fees", { params: status ? { status } : {} }).then((r) => r.data);
export const getFee = (id: string) => api.get(`/api/fees/${id}`).then((r) => r.data);

// --- Notifications ---
export const getNotifications = () => api.get("/api/notifications").then((r) => r.data);
export const markNotificationRead = (id: string) =>
  api.patch(`/api/notifications/${id}/read`).then((r) => r.data);
export const markAllNotificationsRead = () =>
  api.patch("/api/notifications/read-all").then((r) => r.data);

// --- Notices ---
export const getNotices = () => api.get("/api/notices").then((r) => r.data);
export const createNotice = (data: { title: string; body: string; targetRoles: string[] }) =>
  api.post("/api/notices", data).then((r) => r.data);

// --- Classrooms ---
export const getClassrooms = () => api.get("/api/classrooms").then((r) => r.data);
export const getClassroom = (id: string) => api.get(`/api/classrooms/${id}`).then((r) => r.data);

// --- Messages ---
export const getConversations = () => api.get("/api/messages/conversations").then((r) => r.data);
export const getThread = (recipientId: string, before?: string) =>
  api.get(`/api/messages/thread/${recipientId}`, { params: before ? { before } : {} }).then((r) => r.data);
export const sendMessage = (recipientId: string, content: string) =>
  api.post("/api/messages/send", { recipientId, content }).then((r) => r.data);
export const markMessageRead = (id: string) =>
  api.patch(`/api/messages/${id}/read`).then((r) => r.data);

// --- AI Chat ---
export const sendChatMessage = (message: string) =>
  api.post("/api/chat", { message }).then((r) => r.data);

// --- Complaints ---
export const getComplaints = () => api.get("/api/complaints").then((r) => r.data);
export const createComplaint = (data: { subject: string; details: string; priority: string; studentId?: string }) =>
  api.post("/api/complaints", data).then((r) => r.data);
export const updateComplaint = (id: string, data: { status?: string; reply?: string }) =>
  api.patch(`/api/complaints/${id}`, data).then((r) => r.data);

// --- Observations ---
export const createObservation = (data: { studentId: string; tags: string[]; note?: string }) =>
  api.post("/api/observations", data).then((r) => r.data);

// --- Behavior Points ---
export const updateBehaviorPoints = (studentId: string, points: number, reason?: string) =>
  api.patch(`/api/students/${studentId}/behavior`, { points, reason }).then((r) => r.data);

// --- Admin/Teacher Management ---
export const assignTeacher = (classroomId: string, teacherId: string | null) =>
  api.patch(`/api/classrooms/${classroomId}/assign-teacher`, { teacherId }).then((r) => r.data);

export const createTeacher = (data: any) =>
  api.post("/api/users/teacher", data).then((r) => r.data);

export const createStudent = (data: any) =>
  api.post("/api/students", data).then((r) => r.data);

export const assignClassroom = (studentId: string, classroomId: string) =>
  api.patch(`/api/students/${studentId}/classroom`, { classroomId }).then((r) => r.data);


// --- Contacts ---
export const getContacts = () => api.get("/api/contacts").then((r) => r.data);
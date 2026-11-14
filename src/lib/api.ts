import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE_URL = rawApiUrl.replace(/\/+$/, "").replace(/\/api$/, "");

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("maatram_student_token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("maatram_student_token", token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("maatram_student_token");
    localStorage.removeItem("maatram_student_user");
    localStorage.removeItem("maatram_active_role");
    localStorage.removeItem("maatram_volunteer_student");
    localStorage.removeItem("maatram_volunteer_alumni");
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("maatram_volunteer_")) {
        localStorage.removeItem(key);
      }
    });
  }
}

export function saveUser(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("maatram_student_user", JSON.stringify(user));
  }
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("maatram_student_user");
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function getActiveRole(): "student" | "alumni" {
  if (typeof window === "undefined") return "student";
  const role = localStorage.getItem("maatram_active_role");
  return role === "alumni" ? "alumni" : "student";
}

export function setActiveRole(role: "student" | "alumni") {
  if (typeof window !== "undefined") {
    localStorage.setItem("maatram_active_role", role);
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  session?: any;
  user?: any;
  [key: string]: any;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized API call. Session may have expired.");
    }
    return Promise.reject(error);
  }
);

async function callApi<T = any>(
  requestFn: () => Promise<{ data: any }>
): Promise<ApiResponse<T>> {
  try {
    const response = await requestFn();
    return response.data as ApiResponse<T>;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data?.message || "Request failed",
        error: error.response.data?.error,
        status: error.response.status,
      };
    }
    return {
      success: false,
      message: error.message || "Network error. Please check your connection.",
    };
  }
}

// Student & Alumni API service definitions
export const studentApi = {
  // Auth
  login: (credentials: { email?: string; phone?: string; password?: string; rollNumber?: string; otp?: string }) =>
    callApi(() => apiClient.post("/auth/login", credentials)),

  sendOtp: (payload: { phone?: string; email?: string; channel?: string; type?: string }) =>
    callApi(() => apiClient.post("/auth/send-otp", payload)),

  verifyOtp: (payload: { phone?: string; email?: string; token: string; type?: string }) =>
    callApi(() => apiClient.post("/auth/verify-otp", payload)),

  getMe: () => callApi(() => apiClient.get("/auth/me")),

  changePassword: (payload: { email: string; currentPassword?: string; newPassword: string }) =>
    callApi(() => apiClient.post("/auth/change-password", payload)),

  changeEmail: (payload: { currentEmail: string; newEmail: string }) =>
    callApi(() => apiClient.post("/auth/change-email", payload)),

  get2FASetup: (email: string) =>
    callApi(() => apiClient.get(`/auth/setup-2fa?email=${encodeURIComponent(email)}`)),

  toggle2FA: (payload: { email: string; enable: boolean; verificationCode?: string }) =>
    callApi(() => apiClient.post("/auth/toggle-2fa", payload)),

  forgotPasswordSendOtp: (payload: { email: string }) =>
    callApi(() => apiClient.post("/auth/forgot-password/send-otp", payload)),

  forgotPasswordReset: (payload: { email: string; otp: string; newPassword: string; confirmPassword?: string }) =>
    callApi(() => apiClient.post("/auth/forgot-password/reset", payload)),

  // Events (read from shared backend)
  getEvents: () => callApi(() => apiClient.get("/admin/events")),

  // Posts (read from shared backend)
  getPosts: () => callApi(() => apiClient.get("/admin/posts")),

  // Volunteer verification tasks for applicants
  getAssignedApplicants: () => callApi(() => apiClient.get("/admin/applications")),

  updateVolunteerSuggestion: (id: string, suggestion: string, volunteerName: string) =>
    callApi(() =>
      apiClient.patch(`/admin/applications/${id}/volunteer-suggestion`, {
        volunteer_suggestion: suggestion,
        volunteer_name: volunteerName,
      })
    ),

  // Alumni Directory
  getAlumni: () => callApi(() => apiClient.get("/admin/alumni")),

  // Students Directory
  getStudents: () => callApi(() => apiClient.get("/admin/students")),

  // Volunteer Management
  registerVolunteer: (payload: any) => callApi(() => apiClient.post("/admin/volunteers/register", payload)),

  checkVolunteerStatus: (email: string) =>
    callApi(() => apiClient.get(`/admin/volunteers/status/${encodeURIComponent(email)}`)),

  getVolunteersList: () => callApi(() => apiClient.get("/admin/volunteers/list")),

  // Volunteer Event Response (First-Come, First-Served Accept / Reject)
  respondToEvent: (
    eventId: string,
    payload: {
      email: string;
      name?: string;
      role?: string;
      college?: string;
      year_of_study?: string;
      action: "accept" | "reject";
    }
  ) => callApi(() => apiClient.post(`/admin/events/${eventId}/respond`, payload)),

  // Fetch Assigned Applicants for a Volunteer for a Specific Event
  getEventAssignments: (eventId: string, email: string) =>
    callApi(() => apiClient.get(`/admin/events/${eventId}/assignments?email=${encodeURIComponent(email)}`)),

  // Student Academic Records Management
  getAcademicRecords: (email: string) =>
    callApi(() => apiClient.get(`/admin/students/${encodeURIComponent(email)}/academics`)),

  saveAcademicRecords: (email: string, payload: { records: any[]; cgpa?: string }) =>
    callApi(() => apiClient.post(`/admin/students/${encodeURIComponent(email)}/academics`, payload)),
};

export const getAcademicRecords = (email: string) =>
  callApi(() => apiClient.get(`/admin/students/${encodeURIComponent(email)}/academics`));

export const saveAcademicRecords = (email: string, payload: { records: any[]; cgpa?: string }) =>
  callApi(() => apiClient.post(`/admin/students/${encodeURIComponent(email)}/academics`, payload));

export default studentApi;


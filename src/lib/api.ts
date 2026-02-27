// src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor ───────────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor ──────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ✅ Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh token endpoint
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        // Refresh failed, clear auth and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          // Import dynamically to avoid circular dependency
          import("@/store/authStore").then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
          });
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/auth/refresh-token`,
          { refreshToken },
        );

        const newToken = data.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);

        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed, clear everything
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        refreshQueue = [];

        // ✅ Clear auth store and redirect
        if (typeof window !== "undefined") {
          import("@/store/authStore").then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
          });
          window.location.href = "/login";
        }

        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Typed request helpers ─────────────────────────────────────────────────
export const apiGet = async <T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T> => {
  const { data } = await api.get<T>(url, { params });
  return data;
};

export const apiPost = async <T>(url: string, body?: unknown): Promise<T> => {
  const { data } = await api.post<T>(url, body);
  return data;
};

export const apiPut = async <T>(url: string, body?: unknown): Promise<T> => {
  const { data } = await api.put<T>(url, body);
  return data;
};

export const apiPatch = async <T>(url: string, body?: unknown): Promise<T> => {
  const { data } = await api.patch<T>(url, body);
  return data;
};

// Updated apiDelete to support body
export const apiDelete = async <T>(url: string, body?: unknown): Promise<T> => {
  const { data } = await api.delete<T>(url, body ? { data: body } : undefined);
  return data;
};

export const apiUpload = async <T>(
  url: string,
  formData: FormData,
): Promise<T> => {
  const { data } = await api.post<T>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ─── Error message extractor ───────────────────────────────────────────────
export const getApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    // If backend returns field-specific errors, join them
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors
        .map((err: any) => `${err.field}: ${err.message}`)
        .join(", ");
    }

    return data?.message || error.message || "An error occurred";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
};

// ─── Field errors extractor ────────────────────────────────────────────────
export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data?.errors && Array.isArray(data.errors)) {
      const fieldErrors: Record<string, string> = {};
      data.errors.forEach((err: any) => {
        if (err.field) {
          fieldErrors[err.field] = err.message;
        }
      });
      return fieldErrors;
    }
  }
  return {};
};

export default api;

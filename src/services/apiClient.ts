import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) || "http://localhost:5000/api";
export const TOKEN_STORAGE_KEY = "kriya_access_token";

// SSR-Safe localStorage helpers
export const getStoredToken = (): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
};

export const setStoredToken = (token: string): void => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
};

export const removeStoredToken = (): void => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically inject Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      if (typeof window !== "undefined") {
        toast.error("Network Error", {
          description: "Unable to connect to the authentication server. Please check your network connection.",
        });
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message =
      data?.error?.message ||
      data?.message ||
      (typeof data?.error === "string" ? data.error : "An unexpected error occurred.");

    switch (status) {
      case 401:
        // Unauthorized - Clear token if present and emit event
        if (getStoredToken()) {
          removeStoredToken();
          if (typeof window !== "undefined") {
            toast.error("Session Expired", {
              description: "Your session has expired. Please sign in again.",
            });
            if (window.location.pathname !== "/") {
              window.location.href = "/";
            }
          }
        }
        break;

      case 403:
        if (typeof window !== "undefined") {
          toast.error("Access Denied", {
            description: "You do not have permission to perform this action.",
          });
        }
        break;

      case 404:
        if (typeof window !== "undefined") {
          toast.error("Resource Not Found", {
            description: message || "The requested API endpoint was not found.",
          });
        }
        break;

      case 500:
      default:
        if (typeof window !== "undefined") {
          toast.error("Server Error", {
            description: message || "Internal server error. Please try again later.",
          });
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default apiClient;

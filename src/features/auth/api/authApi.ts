import { apiClient } from "@/services/apiClient";
import type { AuthResponse, LoginDTO, MeResponse, RegisterDTO } from "../types/auth.types";

export const loginApi = async (data: LoginDTO): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/login", data);
  return response.data;
};

export const registerApi = async (data: RegisterDTO): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/register", data);
  return response.data;
};

export const getMeApi = async (): Promise<MeResponse> => {
  const response = await apiClient.get<MeResponse>("/auth/me");
  return response.data;
};

export const logoutApi = async (): Promise<{ message?: string }> => {
  try {
    const response = await apiClient.post<{ message?: string }>("/auth/logout");
    return response.data;
  } catch (error) {
    // If backend fails on logout, resolve gracefully so client still clears local state
    return { message: "Logged out locally" };
  }
};

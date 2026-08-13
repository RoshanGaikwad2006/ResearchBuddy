export type UserRole = "ADMIN" | "FACULTY" | "STUDENT" | "RESEARCH_CELL";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  role?: UserRole;
  accessToken?: string;
  token?: string;
  message?: string;
}

export interface MeResponse {
  user: User;
  role?: UserRole;
}

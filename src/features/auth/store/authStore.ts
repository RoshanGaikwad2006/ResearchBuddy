import { create } from "zustand";
import { toast } from "sonner";
import { getStoredToken, removeStoredToken, setStoredToken } from "@/services/apiClient";
import { getMeApi, loginApi, logoutApi, registerApi } from "../api/authApi";
import type { LoginDTO, RegisterDTO, User, UserRole } from "../types/auth.types";
import { queryClient } from "@/lib/queryClient";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginDTO) => Promise<User>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setUser: (user: User | null, token?: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  token: getStoredToken(),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user, token) => {
    if (token) {
      setStoredToken(token);
    }
    const role = user?.role || get().role || null;
    set({
      user,
      role,
      token: token || get().token,
      isAuthenticated: !!user,
    });
  },

  login: async (credentials: LoginDTO) => {
    set({ isLoading: true });
    try {
      const res = await loginApi(credentials);
      const token = res.accessToken || res.token;
      
      if (!token) {
        throw new Error("Invalid response from server: Token missing.");
      }

      setStoredToken(token);

      const userRole = res.user?.role || res.role || "FACULTY";
      const userObj: User = {
        ...res.user,
        role: userRole,
      };

      set({
        user: userObj,
        role: userRole,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success("Welcome back!", {
        description: `Signed in as ${userObj.name || userObj.email} (${userRole}).`,
      });

      return userObj;
    } catch (error: any) {
      set({ isLoading: false });
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to sign in. Please check your credentials.";
      toast.error("Authentication Failed", { description: errorMessage });
      throw error;
    }
  },

  register: async (data: RegisterDTO) => {
    set({ isLoading: true });
    try {
      const res = await registerApi(data);
      const token = res.accessToken || res.token;

      if (token && res.user) {
        setStoredToken(token);
        const userRole = res.user.role || data.role;
        const userObj: User = {
          ...res.user,
          role: userRole,
        };
        set({
          user: userObj,
          role: userRole,
          token: token,
          isAuthenticated: true,
          isLoading: false,
        });
        toast.success("Account Created", {
          description: `Welcome to KRIYA, ${userObj.name}!`,
        });
      } else {
        set({ isLoading: false });
        toast.success("Registration Successful", {
          description: "Your account has been created. Please sign in.",
        });
      }
    } catch (error: any) {
      set({ isLoading: false });
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to create account. Please try again.";
      toast.error("Registration Failed", { description: errorMessage });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutApi();
    } finally {
      removeStoredToken();
      queryClient.clear();
      set({
        user: null,
        role: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      toast.info("Signed Out", {
        description: "You have been logged out of your session.",
      });
    }
  },

  initializeAuth: async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      set({ isInitialized: true, isAuthenticated: false, user: null, role: null });
      return;
    }

    set({ isLoading: true });
    try {
      const meRes = await getMeApi();
      if (meRes?.user) {
        const userRole = meRes.user.role || meRes.role || "FACULTY";
        set({
          user: { ...meRes.user, role: userRole },
          role: userRole,
          token: existingToken,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        });
      } else {
        throw new Error("Invalid session");
      }
    } catch (error) {
      removeStoredToken();
      set({
        user: null,
        role: null,
        token: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/services/api";
import type { User } from "@/types/user.types";
import type { LoginCredentials } from "@/types/auth.types";
import type { ApiResponse } from "@/types/global.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.post<ApiResponse<User>>(
            "/user/login",
            credentials,
          );

          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.error || "Erreur de connexion";
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post("/user/logout");
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        const currentState = useAuthStore.getState();
        if (!currentState.isAuthenticated && !currentState.user) {
          set({ isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });

          const response = await api.get<ApiResponse<User>>("/user/me");

          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          if (error.response?.status === 401) {
            try {
              await api.post("/user/logout");
            } catch (error) {}
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);

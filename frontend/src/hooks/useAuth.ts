import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore();

  const isAdmin = user?.role === "admin";
  const isSupport = user?.role === "support";
  const isUser = user?.role === "user";

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isSupport,
    isUser,
    login,
    logout,
    checkAuth,
    clearError,
  };
};

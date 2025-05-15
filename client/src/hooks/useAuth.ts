import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken, removeAuthToken } from "@/lib/auth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const fetchUserData = async () => {
    try {
      const userData = await apiRequest<User>("/api/auth/me");
      queryClient.setQueryData(["/api/auth/me"], userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      setAuthToken(response.token);
      await fetchUserData();
      return response.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, organizationName: string) => {
    try {
      const response = await apiRequest<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, organizationName }),
      });
      
      setAuthToken(response.token);
      await fetchUserData();
      return response.user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      removeAuthToken();
      queryClient.clear();
    } catch (error) {
      console.error("Logout error:", error);
      // Still remove token and clear cache on error
      removeAuthToken();
      queryClient.clear();
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    fetchUserData,
  };
}
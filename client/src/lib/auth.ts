import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  organizationId: string | number | null;
  avatar?: string | null;
  status?: string;
}

interface Organization {
  id: string | number;
  name: string;
  email: string;
  plan: string;
  logo?: string | null;
  webhookUrl?: string | null;
  onboardingCompleted: boolean;
  position?: string | null;
  industry?: string | null;
  companySize?: string | null;
  signingFrequency?: string | null;
  creationFrequency?: string | null;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    organizationName: string,
  ) => Promise<void>;
  logout: () => void;
  fetchUserData: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ email, password }),
            credentials: "include",
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage: string;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || "Login failed";
            } catch {
              errorMessage =
                errorText || `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const data: { user: User; token: string } = await response.json();

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          await get().fetchUserData();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (
        name: string,
        email: string,
        password: string,
        organizationName: string,
      ) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              password,
              organizationName,
            }),
            credentials: "include",
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage: string;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || "Registration failed";
            } catch {
              errorMessage =
                errorText || `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const data: { user: User; token: string } = await response.json();

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          await get().fetchUserData();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("auth-storage");

        set({
          user: null,
          organization: null,
          token: null,
          isAuthenticated: false,
        });
      },

      fetchUserData: async () => {
        if (!get().token) return;

        set({ isLoading: true });
        try {
          const response = await fetch(`/api/auth/me?t=${Date.now()}`, {
            headers: {
              Authorization: `Bearer ${get().token}`,
              Accept: "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
            credentials: "include",
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage: string;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || "Failed to fetch user data";
            } catch {
              errorMessage =
                errorText || `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const data: { user: User; organization: Organization } =
            await response.json();

          set({
            user: data.user,
            organization: data.organization,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          console.error("Error fetching user data:", error);

          if (
            error instanceof Error &&
            (error.message.includes("401") ||
              error.message.includes("Unauthorized"))
          ) {
            get().logout();
          }
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Export a function to get the token directly from the store
export const getAuthToken = () => useAuthStore.getState().token;

export const useAuth = useAuthStore;

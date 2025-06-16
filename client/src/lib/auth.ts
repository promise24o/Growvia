import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string[] | null;
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

interface MarketerApplication {
  id: string;
  name: string;
  email: string;
  status: string;
  organization: { name: string; id: string };
}

interface AuthState {
  user: User | null;
  organization: Organization[] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    organizationName: string
  ) => Promise<void>;
  logout: () => void;
  loginWithToken: (token: string, user: User) => Promise<void>;
  fetchUserData: () => Promise<void>;
  verifyMarketerApplication: (token: string) => Promise<MarketerApplication>;
  submitMarketerApplication: (
    token: string,
    data: {
      experience: string;
      skills: string[];
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      facebook?: string;
      resume: File;
      kycDocument: File;
    }
  ) => Promise<void>;
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

          if (data.user.role === "management") {
            window.location.href = "/management/dashboard";
          } else {
            window.location.href = "/dashboard";
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (
        name: string,
        email: string,
        password: string,
        organizationName: string
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
        set({
          user: null,
          organization: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("auth-storage");
      },

      loginWithToken: async (token: string, user: User) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        await get().fetchUserData();
        window.location.href =
          user.role === "management" ? "/management/dashboard" : "/dashboard";
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

          if (response.status === 404) {
            set({
              user: null,
              organization: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            localStorage.removeItem("auth-storage");
            return;
          }

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

          const data: { user: User; organizations: Organization[] } =
            await response.json();

          set({
            user: data.user,
            organization: data.organizations,
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
      
      verifyMarketerApplication: async (token: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`/api/marketers/verify/${token}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage: string;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || "Verification failed";
            } catch {
              errorMessage =
                errorText || `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const data: { valid: boolean; application: MarketerApplication } =
            await response.json();

          if (!data.valid) {
            throw new Error("Invalid or expired invitation");
          }

          set({ isLoading: false });
          return data.application;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      submitMarketerApplication: async (
        token: string,
        data: {
          experience: string;
          skills: string[];
          twitter?: string;
          instagram?: string;
          linkedin?: string;
          facebook?: string;
          resume: File;
          kycDocument: File;
        }
      ) => {
        set({ isLoading: true });
        try {
          const formData = new FormData();
          formData.append("experience", data.experience);
          formData.append("skills", data.skills.join(","));
          if (data.twitter) formData.append("twitter", data.twitter);
          if (data.instagram) formData.append("instagram", data.instagram);
          if (data.linkedin) formData.append("linkedin", data.linkedin);
          if (data.facebook) formData.append("facebook", data.facebook);
          formData.append("resume", data.resume);
          formData.append("kycDocument", data.kycDocument);

          const response = await fetch(
            `/api/marketers/application/${token}/submit`,
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage: string;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || "Submission failed";
            } catch {
              errorMessage =
                errorText || `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const responseData = await response.json();

          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
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
    }
  )
);

export const getAuthToken = () => useAuthStore.getState().token;

export const useAuth = useAuthStore;

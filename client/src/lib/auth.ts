import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from './queryClient';

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
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => void;
  fetchUserData: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
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
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || 'Login failed';
            } catch (e) {
              errorMessage = errorText || `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
          
          // Fetch additional user data including organization
          await get().fetchUserData();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      register: async (name: string, email: string, password: string, organizationName: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              name,
              email,
              password,
              organizationName
            }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || 'Registration failed';
            } catch (e) {
              errorMessage = errorText || `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
          
          // Fetch additional user data including organization
          await get().fetchUserData();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        // Force clear localStorage completely to ensure no stale data
        localStorage.removeItem('auth-storage');
        
        // Clear state
        set({
          user: null,
          organization: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      fetchUserData: async () => {
        if (!get().token) return;
        
        set({ isLoading: true });
        try {
          // Add cache-busting query param to ensure we always get fresh data
          const response = await fetch(`/api/auth/me?t=${Date.now()}`, {
            headers: {
              'Authorization': `Bearer ${get().token}`,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || 'Failed to fetch user data';
            } catch (e) {
              errorMessage = errorText || `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          
          set({
            user: data.user,
            organization: data.organization,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          console.error('Error fetching user data:', error);
          
          // If unauthorized, logout
          if (error instanceof Error && (
            error.message.includes('401') || 
            error.message.includes('Unauthorized')
          )) {
            get().logout();
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

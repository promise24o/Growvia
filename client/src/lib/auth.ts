import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from './queryClient';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  organizationId: number | null;
  avatar?: string | null;
  status?: string;
}

interface Organization {
  id: number;
  name: string;
  plan: string;
  logo?: string | null;
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
          const response = await apiRequest('POST', '/api/auth/login', { email, password });
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
          const response = await apiRequest('POST', '/api/auth/register', {
            name,
            email,
            password,
            organizationName
          });
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
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${get().token}`
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          const data = await response.json();
          
          set({
            user: data.user,
            organization: data.organization,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          
          // If unauthorized, logout
          if (error instanceof Error && error.message.includes('401')) {
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

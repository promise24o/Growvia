import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authState = JSON.parse(authStorage);
      return authState.state?.token || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const method = options?.method || 'GET';
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  } as Record<string, string>;
  
  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: options?.body,
    credentials: "include",
    ...options
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getAuthToken();
    const headers = {} as Record<string, string>;
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

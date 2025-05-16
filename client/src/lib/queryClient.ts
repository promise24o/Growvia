import { getAuthToken } from "@/lib/auth";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const contentType = res.headers.get("Content-Type")?.toLowerCase();
    const text = (await res.text()) || res.statusText;

    let errorMessage = text;
    if (contentType?.includes("application/json")) {
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || JSON.stringify(errorData) || text;
      } catch {
        // Not valid JSON, use raw text
      }
    } else if (contentType?.includes("text/html")) {
      errorMessage = `Server returned HTML (likely an error page): ${text.slice(
        0,
        100
      )}...`;
    }

    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const method = options?.method || "GET";
  const token = getAuthToken();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    body: options?.body,
    credentials: "include",
    ...options,
  });

  await throwIfResNotOk(res);

  const contentType = res.headers.get("Content-Type")?.toLowerCase();
  if (!contentType?.includes("application/json")) {
    throw new Error(`Expected JSON response, got ${contentType}`);
  }

  return res.json() as Promise<T>;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn =
  <T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const token = getAuthToken();
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);

    const contentType = res.headers.get("Content-Type")?.toLowerCase();
    if (!contentType?.includes("application/json")) {
      throw new Error(`Expected JSON response, got ${contentType}`);
    }

    return res.json() as Promise<T>;
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

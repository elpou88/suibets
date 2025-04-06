import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      // Try to parse the error as JSON first
      const data = await res.json();
      errorMessage = data.message || data.error || JSON.stringify(data);
    } catch (e) {
      // If JSON parsing fails, fall back to text
      try {
        errorMessage = await res.text();
      } catch (textError) {
        // If all else fails, use the status text
        errorMessage = res.statusText;
      }
    }

    // Create a more detailed error object
    const error = new Error(`${res.status}: ${errorMessage}`);
    // Add custom properties for specific error handling
    (error as any).status = res.status;
    (error as any).isInsufficientFunds = errorMessage.includes('insufficient funds') || 
                                         errorMessage.includes('insufficient balance');
    (error as any).isNetworkError = res.status >= 500 || res.status === 0;
    (error as any).isAuthError = res.status === 401 || res.status === 403;
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
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

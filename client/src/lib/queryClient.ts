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
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Special handling for network errors and sports data API issues
    if (res.status >= 500) {
      console.warn(`Server error ${res.status} from ${url}`);
      
      // For specific endpoints related to sports data, try to use the tracked data as fallback
      if (url.includes('/api/events') && url.includes('sportId=')) {
        // Extract sportId from URL
        const sportIdMatch = url.match(/sportId=(\d+)/);
        const sportId = sportIdMatch ? Number(sportIdMatch[1]) : null;
        
        // For certain problematic sports (Cricket, Cycling, etc.), try fallback
        if (sportId && [9, 14].includes(sportId)) {
          console.log(`Attempting fallback for sport ID ${sportId}`);
          try {
            // Try the tracked events endpoint which is more reliable
            const fallbackResponse = await fetch('/api/events/tracked');
            if (fallbackResponse.ok) {
              // Custom enhanced response object with original status and ok properties
              const enhancedRes = fallbackResponse.clone();
              // Add metadata about using fallback
              Object.defineProperty(enhancedRes, 'usedFallback', {
                value: true,
                writable: false
              });
              return enhancedRes;
            }
          } catch (fallbackError) {
            console.error('Fallback fetch also failed:', fallbackError);
          }
        }
      }
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Check if this is a network error (unavailable server)
    if (error instanceof TypeError && error.message.includes('NetworkError')) {
      console.error('Network error during fetch:', error);
      
      // For critical API endpoints, create a synthetic response
      if (url.includes('/api/events')) {
        // Provide special handling for events API
        console.warn('Creating fallback response for events API');
        
        const mockResponse = new Response(
          JSON.stringify([]), 
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' },
          }
        );
        
        // Add metadata about error
        Object.defineProperty(mockResponse, 'originalError', {
          value: error,
          writable: false
        });
        
        return mockResponse;
      }
    }
    
    // Re-throw other errors
    throw error;
  }
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

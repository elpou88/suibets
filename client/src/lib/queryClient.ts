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
  options?: { timeout?: number },
): Promise<Response> {
  try {
    // If a timeout is specified, use AbortController to enforce it
    let abortController: AbortController | undefined;
    let timeoutId: NodeJS.Timeout | undefined;
    
    // Increase default timeout for API calls to 20 seconds for events endpoints
    const effectiveTimeout = url.includes('/api/events') ? 
      (options?.timeout || 20000) : // Use 20 seconds for events endpoints if not specified
      (options?.timeout || 15000);  // Use 15 seconds for other endpoints if not specified
    
    // Always use an AbortController with timeout to avoid hanging requests
    abortController = new AbortController();
    timeoutId = setTimeout(() => {
      abortController?.abort(`Request timeout after ${effectiveTimeout}ms`);
    }, effectiveTimeout);
    
    console.log(`API Request to ${url} with ${effectiveTimeout}ms timeout`);
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: abortController.signal,
    });
    
    // Clear the timeout if the request completed successfully
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Enhanced handling for network errors and sports data API issues
    if (res.status >= 500 || res.status === 0) {
      console.warn(`Server error ${res.status} from ${url}`);
      
      // For any endpoints related to sports data, try to use fallbacks
      if (url.includes('/api/events')) {
        console.log(`Attempting fallback for API request: ${url}`);
        
        try {
          // First, try the tracked events endpoint which is more reliable
          const fallbackResponse = await fetch('/api/events/tracked', {
            credentials: "include",
            // Set a timeout for fallback requests
            signal: AbortSignal.timeout(10000)
          });
          
          if (fallbackResponse.ok) {
            console.log("Successfully used tracked events fallback");
            // Add metadata about using fallback
            Object.defineProperty(fallbackResponse, 'usedFallback', {
              value: true,
              writable: false
            });
            return fallbackResponse;
          }
        } catch (fallbackError) {
          console.warn('Primary fallback request failed:', fallbackError);
        }
        
        // If tracked events fails or is not available, try events without parameters
        try {
          const secondaryFallbackResponse = await fetch('/api/events', {
            credentials: "include",
            // Set a timeout for secondary fallback
            signal: AbortSignal.timeout(8000)
          });
          
          if (secondaryFallbackResponse.ok) {
            console.log("Successfully used secondary events fallback");
            // Add metadata about using fallback
            Object.defineProperty(secondaryFallbackResponse, 'usedFallback', {
              value: true,
              writable: false
            });
            return secondaryFallbackResponse;
          }
        } catch (secondaryFallbackError) {
          console.warn('Secondary fallback request also failed:', secondaryFallbackError);
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

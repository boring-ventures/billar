"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

// Generic fetch function
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || "An error occurred");
  }
  
  return response.json();
}

// GET hook
export function useApiQuery<T>(
  key: string[], 
  url: string, 
  options?: { 
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: () => apiFetch<T>(url),
    ...options
  });
}

// URL can be either a string or a function that returns a string based on data
type UrlParam<U> = string | ((data: U) => string);

// POST/PUT/DELETE hook with dynamic URL support
export function useApiMutation<T, U = any>(
  url: UrlParam<U>, 
  method: string = "POST",
  options?: {
    onSuccessMessage?: string;
    onErrorMessage?: string;
    invalidateQueries?: (string[] | ((data: U) => string[]))[];
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: U) => {
      // Resolve URL - either use static string or call function with data
      const resolvedUrl = typeof url === 'function' ? url(data) : url;
      
      return apiFetch<T>(resolvedUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      // Show success toast if message provided
      if (options?.onSuccessMessage) {
        toast({
          title: "Success",
          description: options.onSuccessMessage,
        });
      }
      
      // Invalidate related queries as specified or use default
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(keyOrFn => {
          // Handle both static arrays and functions that generate keys
          const queryKey = typeof keyOrFn === 'function' 
            ? keyOrFn(variables)
            : keyOrFn;
            
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // For dynamic URLs, we can't reliably determine a default invalidation key
        const staticUrl = typeof url === 'string' ? url : '';
        if (staticUrl) {
          const defaultKey = staticUrl.split('/')[2] || staticUrl.split('/')[1];
          queryClient.invalidateQueries({ queryKey: [defaultKey] });
        }
      }
    },
    onError: (error: Error) => {
      // Show error toast if message provided or use error message
      toast({
        title: "Error",
        description: options?.onErrorMessage || error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });
} 
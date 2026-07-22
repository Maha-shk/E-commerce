"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AxiosError } from "axios";
import { Toaster } from "sonner";

/**
 * Client-side providers for the whole app: TanStack Query + toast host.
 *
 * The QueryClient is created inside useState so each browser session gets its
 * own instance and it is never shared across requests during SSR.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for a minute — avoids refetch storms while
            // navigating between admin screens.
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Never retry auth/permission/not-found errors; they won't fix
              // themselves and retrying just delays the error UI.
              const status =
                error instanceof AxiosError ? error.response?.status : undefined;
              if (status && [400, 401, 403, 404, 422].includes(status)) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" closeButton />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

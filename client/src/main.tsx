import { trpc } from "@/lib/trpc";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { useMemo, useRef } from "react";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// QueryClient is stable — created once outside any component
const queryClient = new QueryClient();

// Inner component that has access to Clerk auth context
function AppWithTrpc() {
  const { getToken } = useClerkAuth();

  // Keep a stable ref to getToken so the useMemo dependency doesn't change
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Stabilize the tRPC client so it is created only once.
  // Creating it inside the component without useMemo causes a new proxy on
  // every render; React DevTools then diffs old vs new props and calls the
  // proxy with unexpected property names, triggering "client[procedureType]
  // is not a function".
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            async fetch(input, init) {
              let token: string | null = null;
              try {
                token = await getTokenRef.current();
              } catch {
                // Not signed in — proceed without token
              }

              const headers: Record<string, string> = {
                ...(init?.headers as Record<string, string> ?? {}),
              };
              if (token) {
                headers["Authorization"] = `Bearer ${token}`;
              }

              return globalThis.fetch(input, {
                ...(init ?? {}),
                headers,
              });
            },
          }),
        ],
      }),
    // Empty deps: client is intentionally created once. getToken is accessed
    // via ref so we always use the latest version without recreating the client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={publishableKey}>
    <AppWithTrpc />
  </ClerkProvider>
);

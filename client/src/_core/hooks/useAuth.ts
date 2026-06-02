import { trpc } from "@/lib/trpc";
import { useClerk } from "@clerk/clerk-react";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const { signOut } = useClerk();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    // Sign out from Clerk (clears the Clerk session client-side)
    await signOut();
    // Clear the local tRPC cache so the UI reflects the signed-out state immediately
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [signOut, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}

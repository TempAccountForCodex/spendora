import { authClient } from "@/lib/auth-client";

export function useAuthSession() {
  const session = authClient.useSession();

  return {
    session: session.data?.session ?? null,
    user: session.data?.user ?? null,
    isSignedIn: Boolean(session.data?.session),
    isPending: session.isPending,
    isRefetching: session.isRefetching,
    error: session.error,
    refetch: session.refetch,
  };
}

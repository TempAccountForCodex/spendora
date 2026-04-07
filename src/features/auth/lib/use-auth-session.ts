import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clearAuthProfileCache,
  ensureAuthProfile,
  getProfileCurrencyValue,
  type AuthProfile,
} from "@/features/auth/lib/auth-profile";
import { authClient } from "@/lib/auth-client";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

export type AuthenticatedAppUser = SessionUser & {
  currency: string | null;
};

export function useAuthSession() {
  const sessionState = authClient.useSession();
  const baseUser = (sessionState.data?.user ?? null) as SessionUser | null;
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [isProfilePending, setIsProfilePending] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!baseUser) {
      setProfile(null);
      setProfileError(null);
      setIsProfilePending(false);
      return;
    }

    setIsProfilePending(true);
    setProfileError(null);

    void ensureAuthProfile(baseUser)
      .then((nextProfile) => {
        if (!isCancelled) {
          setProfile(nextProfile);
          setIsProfilePending(false);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setProfileError(
            error instanceof Error
              ? error
              : new Error("Unable to load your profile."),
          );
          setIsProfilePending(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [baseUser]);

  const refetch = useCallback(async () => {
    await sessionState.refetch();

    const latestSession = (await authClient.getSession()) as {
      data?: {
        user?: SessionUser | null;
      } | null;
    };

    const latestUser = latestSession.data?.user ?? null;

    if (!latestUser) {
      clearAuthProfileCache();
      setProfile(null);
      setProfileError(null);
      return;
    }

    const refreshedProfile = await ensureAuthProfile(latestUser, { force: true });
    setProfile(refreshedProfile);
    setProfileError(null);
  }, [sessionState]);

  const mergedUser = useMemo<AuthenticatedAppUser | null>(() => {
    if (!baseUser) {
      return null;
    }

    return {
      ...baseUser,
      currency: getProfileCurrencyValue(profile),
    };
  }, [baseUser, profile]);

  return {
    session: sessionState.data?.session ?? null,
    user: mergedUser,
    isSignedIn: Boolean(sessionState.data?.session),
    isPending: sessionState.isPending || (Boolean(baseUser) && isProfilePending),
    isRefetching: sessionState.isRefetching,
    error: sessionState.error ?? profileError,
    refetch,
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clearAuthProfileCache,
  getAuthProfile,
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
  const [resolvedProfileUserId, setResolvedProfileUserId] = useState<string | null>(
    null,
  );
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [isProfilePending, setIsProfilePending] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!baseUser) {
      setProfile(null);
      setResolvedProfileUserId(null);
      setProfileError(null);
      setIsProfilePending(false);
      return;
    }

    setIsProfilePending(true);
    setProfileError(null);

    void getAuthProfile(baseUser, { force: true })
      .then((nextProfile) => {
        if (!nextProfile) {
          clearAuthProfileCache(baseUser.id);

          if (!isCancelled) {
            setProfile(null);
            setResolvedProfileUserId(baseUser.id);
            setProfileError(null);
            setIsProfilePending(false);
          }

          return;
        }

        if (!isCancelled) {
          setProfile(nextProfile);
          setResolvedProfileUserId(baseUser.id);
          setIsProfilePending(false);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setProfile(null);
          setResolvedProfileUserId(baseUser.id);
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
      setResolvedProfileUserId(null);
      setProfileError(null);
      return;
    }

    const refreshedProfile = await getAuthProfile(latestUser, { force: true });

    if (!refreshedProfile) {
      clearAuthProfileCache(latestUser.id);
      setProfile(null);
      setResolvedProfileUserId(latestUser.id);
      setProfileError(null);
      return;
    }

    setProfile(refreshedProfile);
    setResolvedProfileUserId(latestUser.id);
    setProfileError(null);
  }, [sessionState]);

  const hasResolvedCurrentProfile =
    !baseUser || resolvedProfileUserId === baseUser.id;

  const mergedUser = useMemo<AuthenticatedAppUser | null>(() => {
    if (
      !baseUser ||
      !profile ||
      resolvedProfileUserId !== baseUser.id
    ) {
      return null;
    }

    return {
      ...baseUser,
      currency: getProfileCurrencyValue(profile),
    };
  }, [baseUser, profile, resolvedProfileUserId]);

  return {
    session: sessionState.data?.session ?? null,
    user: mergedUser,
    isSignedIn: Boolean(sessionState.data?.session) && Boolean(mergedUser),
    isPending:
      sessionState.isPending ||
      (Boolean(baseUser) && (!hasResolvedCurrentProfile || isProfilePending)),
    isRefetching: sessionState.isRefetching,
    error: sessionState.error ?? profileError,
    refetch,
  };
}

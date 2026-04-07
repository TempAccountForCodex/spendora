import {
  type SupportedCurrencyCode,
  isSupportedCurrencyCode,
} from "@/constants/currencies";
import { neonDataFetch } from "@/lib/neon-data-api";

export type AuthProfile = {
  userId: string;
  currency: string | null;
};

type BaseSessionUser = {
  id: string;
};

type ProfileRow = {
  user_id: string;
  currency: string;
};

const profileCache = new Map<string, AuthProfile>();
const inflightProfiles = new Map<string, Promise<AuthProfile>>();

function normalizeProfile(row: ProfileRow): AuthProfile {
  return {
    userId: row.user_id,
    currency: row.currency,
  };
}

function getProfilePath(userId: string) {
  return `/profiles?select=user_id,currency&user_id=eq.${encodeURIComponent(
    userId,
  )}&limit=1`;
}

async function fetchProfile(userId: string) {
  const rows = await neonDataFetch<ProfileRow[]>(getProfilePath(userId));
  return rows[0] ? normalizeProfile(rows[0]) : null;
}

async function insertProfile(userId: string) {
  const rows = await neonDataFetch<ProfileRow[]>("/profiles", {
    method: "POST",
    body: {
      user_id: userId,
      currency: "",
    },
    headers: {
      Prefer: "return=representation",
    },
  });

  if (!rows[0]) {
    throw new Error("Unable to create a profile record.");
  }

  return normalizeProfile(rows[0]);
}

export function clearAuthProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId);
    inflightProfiles.delete(userId);
    return;
  }

  profileCache.clear();
  inflightProfiles.clear();
}

export async function ensureAuthProfile(
  user: BaseSessionUser,
  options: { force?: boolean } = {},
) {
  if (!options.force && profileCache.has(user.id)) {
    return profileCache.get(user.id)!;
  }

  const existingRequest = inflightProfiles.get(user.id);

  if (existingRequest && !options.force) {
    return existingRequest;
  }

  const request = (async () => {
    const existingProfile = await fetchProfile(user.id);

    if (existingProfile) {
      profileCache.set(user.id, existingProfile);
      return existingProfile;
    }

    const createdProfile = await insertProfile(user.id);
    profileCache.set(user.id, createdProfile);
    return createdProfile;
  })();

  inflightProfiles.set(user.id, request);

  try {
    return await request;
  } finally {
    inflightProfiles.delete(user.id);
  }
}

export async function saveAuthProfileCurrency(
  userId: string,
  currency: SupportedCurrencyCode,
) {
  const profile = await ensureAuthProfile({ id: userId });
  const rows = await neonDataFetch<ProfileRow[]>(
    `/profiles?user_id=eq.${encodeURIComponent(profile.userId)}`,
    {
      method: "PATCH",
      body: {
        currency,
      },
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  if (!rows[0]) {
    throw new Error("Unable to update your currency.");
  }

  const nextProfile = normalizeProfile(rows[0]);
  profileCache.set(userId, nextProfile);
  return nextProfile;
}

export function getProfileCurrencyValue(profile: AuthProfile | null) {
  if (!profile?.currency) {
    return "";
  }

  return isSupportedCurrencyCode(profile.currency) ? profile.currency : "";
}

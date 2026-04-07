import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";
import { getNeonAuthUrl } from "@/lib/neon-public-config";

type AuthClientWithCookie = typeof authClient & {
  getCookie?: () => string;
};

type TokenResponse = {
  token?: string;
  message?: string;
};

function getCookieHeader() {
  const authClientWithCookie = authClient as AuthClientWithCookie;
  return authClientWithCookie.getCookie?.() ?? "";
}

export async function getNeonAuthToken() {
  const neonAuthUrl = getNeonAuthUrl();
  const headers = new Headers({
    accept: "application/json",
    origin: new URL(neonAuthUrl).origin,
  });

  if (Platform.OS !== "web") {
    const cookie = getCookieHeader();

    if (!cookie) {
      throw new Error("Missing mobile auth session cookie.");
    }

    headers.set("cookie", cookie);
  }

  const response = await fetch(`${neonAuthUrl}/token`, {
    method: "GET",
    headers,
    credentials: Platform.OS === "web" ? "include" : "omit",
  });

  const payload = (await response.json().catch(() => null)) as TokenResponse | null;

  if (!response.ok || !payload?.token) {
    throw new Error(
      payload?.message ?? "Unable to get an authenticated Neon token.",
    );
  }

  return payload.token;
}

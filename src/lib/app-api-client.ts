import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";
import { getAuthBaseUrl } from "@/lib/auth-base-url";

type AppApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
};

type AuthClientWithCookie = typeof authClient & {
  getCookie?: () => string;
};

function getCookieHeader() {
  const authClientWithCookie = authClient as AuthClientWithCookie;

  return authClientWithCookie.getCookie?.() ?? "";
}

export async function appApiFetch<T>(
  path: string,
  options: AppApiOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs ?? 10000);

  try {
    const headers = new Headers();

    if (options.body !== undefined) {
      headers.set("content-type", "application/json");
    }

    if (Platform.OS !== "web") {
      const cookie = getCookieHeader();

      if (cookie) {
        headers.set("cookie", cookie);
      }
    }

    const response = await fetch(`${getAuthBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : `Request failed with status ${response.status}.`;

      throw new Error(message);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out while contacting the server.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

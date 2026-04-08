import { getNeonAuthToken } from "@/lib/neon-auth-token";
import { getNeonDataApiUrl } from "@/lib/neon-public-config";

type NeonDataApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

type NeonDataApiOptions = {
  method?: NeonDataApiMethod;
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
  authToken?: string;
};

type ErrorPayload = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export async function neonDataFetch<T>(
  path: string,
  options: NeonDataApiOptions = {},
) {
  const token = options.authToken ?? (await getNeonAuthToken());
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);

  try {
    const headers = new Headers(options.headers);
    headers.set("authorization", `Bearer ${token}`);
    headers.set("accept", "application/json");

    if (options.body !== undefined) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(`${getNeonDataApiUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | ErrorPayload
      | T
      | null;

    if (!response.ok) {
      const errorPayload = payload as ErrorPayload | null;
      throw new Error(
        errorPayload?.message ??
          errorPayload?.details ??
          errorPayload?.hint ??
          `Request failed with status ${response.status}.`,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out while contacting Neon.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

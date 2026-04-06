import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { getAuthBaseUrl } from "@/lib/auth-base-url";

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  plugins: [
    expoClient({
      scheme: "spendora",
      storagePrefix: "spendora",
      storage: SecureStore,
    }),
  ],
});

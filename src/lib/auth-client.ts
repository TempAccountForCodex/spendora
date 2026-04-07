import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { getNeonAuthUrl } from "@/lib/neon-public-config";

const neonAuthUrl = getNeonAuthUrl();
const neonAuthOrigin = new URL(neonAuthUrl).origin;

export const authClient = createAuthClient({
  baseURL: neonAuthUrl,
  fetchOptions: {
    headers: {
      origin: neonAuthOrigin,
    },
  },
  plugins: [
    expoClient({
      scheme: "spendora",
      storagePrefix: "spendora-neon",
      cookiePrefix: ["neon-auth", "better-auth"],
      storage: SecureStore,
    }),
  ],
});

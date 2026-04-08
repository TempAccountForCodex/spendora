import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is missing.");
}

const configuredBaseURL =
  process.env.BETTER_AUTH_URL ?? process.env.EXPO_PUBLIC_BETTER_AUTH_URL;

const baseURL: BetterAuthOptions["baseURL"] = configuredBaseURL
  ? configuredBaseURL.replace(/\/$/, "")
  : {
      allowedHosts: [
        "localhost:*",
        "127.0.0.1:*",
        "192.168.*.*:*",
        "10.*.*.*:*",
        "172.*.*.*:*",
      ],
      fallback: "http://localhost:8081",
      protocol: "auto",
    };

const trustedOrigins = [
  "spendora://",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://192.168.*.*:*",
  "http://10.*.*.*:*",
  "http://172.*.*.*:*",
];

if (process.env.NODE_ENV === "development") {
  trustedOrigins.push(
    "exp://localhost:*",
    "exp://127.0.0.1:*",
    "exp://192.168.*.*:*",
    "exp://10.*.*.*:*",
    "exp://172.*.*.*:*",
  );
}

export const auth = betterAuth({
  baseURL,
  appName: "Spenza",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    camelCase: true,
    transaction: true,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedProxyHeaders: true,
  user: {
    additionalFields: {
      currency: {
        type: "string",
        required: true,
        defaultValue: "",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins,
  plugins: [expo()],
});

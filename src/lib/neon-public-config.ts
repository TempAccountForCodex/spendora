const neonAuthUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL?.replace(/\/$/, "");
const neonDataApiUrl = process.env.EXPO_PUBLIC_NEON_DATA_API_URL?.replace(
  /\/$/,
  "",
);
const neonAuthJwksUrl = process.env.EXPO_PUBLIC_NEON_AUTH_JWKS_URL?.replace(
  /\/$/,
  "",
);

export function isNeonClientConfigured() {
  return Boolean(neonAuthUrl && neonDataApiUrl);
}

export function getNeonAuthUrl() {
  if (!neonAuthUrl) {
    throw new Error(
      "Missing EXPO_PUBLIC_NEON_AUTH_URL in the build environment.",
    );
  }

  return neonAuthUrl;
}

export function getNeonDataApiUrl() {
  if (!neonDataApiUrl) {
    throw new Error(
      "Missing EXPO_PUBLIC_NEON_DATA_API_URL in the build environment.",
    );
  }

  return neonDataApiUrl;
}

export function getNeonAuthJwksUrl() {
  if (!neonAuthJwksUrl) {
    throw new Error(
      "Missing EXPO_PUBLIC_NEON_AUTH_JWKS_URL in the build environment.",
    );
  }

  return neonAuthJwksUrl;
}

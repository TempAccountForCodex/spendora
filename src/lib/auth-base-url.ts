import Constants from "expo-constants";
import { Platform } from "react-native";

export function getAuthBaseUrl() {
  const explicitBaseUrl = process.env.EXPO_PUBLIC_BETTER_AUTH_URL;

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    return `http://${hostUri.split("/")[0]}`;
  }

  return "http://localhost:8081";
}

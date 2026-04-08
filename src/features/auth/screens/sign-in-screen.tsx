import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { colors, spacing, typography } from "@/constants/theme";
import { AuthScreenShell } from "@/features/auth/components/auth-screen-shell";
import {
  clearAuthProfileCache,
  getAuthProfile,
  getProfileCurrencyValue,
} from "@/features/auth/lib/auth-profile";
import {
  mapAuthErrorMessage,
  type AuthFieldErrors,
  validateSignInForm,
} from "@/features/auth/lib/auth-form";
import { getAuthenticatedRoute } from "@/features/auth/lib/get-authenticated-route";
import { authClient } from "@/lib/auth-client";
import { hp } from "@/lib/responsive";

export function SignInScreenView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setFieldErrors((current) => ({ ...current, email: undefined }));
    setErrorMessage(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setFieldErrors((current) => ({ ...current, password: undefined }));
    setErrorMessage(null);
  };

  const handleSignIn = async () => {
    if (isSubmitting) {
      return;
    }

    const nextFieldErrors = validateSignInForm({ email, password });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage(null);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setErrorMessage(null);

    try {
      const response = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe: true,
      });

      const { error } = response;

      if (error) {
        setErrorMessage(mapAuthErrorMessage(error.message));
        setIsSubmitting(false);
        return;
      }

      const latestSession = (await authClient.getSession()) as {
        data?: {
          user?: {
            id: string;
          } | null;
        } | null;
      };

      const signedInUser = latestSession.data?.user ?? null;

      if (!signedInUser) {
        throw new Error("Signed in, but the session could not be restored.");
      }

      const profile = await getAuthProfile(signedInUser, { force: true });

      if (!profile) {
        clearAuthProfileCache(signedInUser.id);
        await authClient.signOut();
        setErrorMessage(
          "This account no longer exists. Sign up again to restore it.",
        );
        setIsSubmitting(false);
        return;
      }

      router.replace(
        getAuthenticatedRoute({
          currency: getProfileCurrencyValue(profile),
        }),
      );
    } catch (error) {
      setErrorMessage(
        mapAuthErrorMessage(error instanceof Error ? error.message : null),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title="Sign In"
      backHref="/get-started"
      heroMinHeight={hp(40)}
      heroContent={
        <Image
          source={require("../../../../assets/images/app_icon.png")}
          style={styles.heroLogo}
          contentFit="cover"
        />
      }
    >
      <View style={styles.form}>
        <AppInput
          label="Email"
          value={email}
          onChangeText={handleEmailChange}
          placeholder="jane@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={fieldErrors.email}
        />
        <AppInput
          label="Password"
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Enter your password"
          secureTextEntry
          error={fieldErrors.password}
        />
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.actions}>
        <AppButton
          label={isSubmitting ? "Signing In..." : "Sign In"}
          onPress={handleSignIn}
          disabled={isSubmitting}
          variant="hero"
          pill
        />
        <AppButton
          label="Don't have an account? "
          hrefText="Create one"
          variant="text"
          onPress={() => router.push("/sign-up")}
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  heroLogo: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  error: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.danger,
    textAlign: "center",
  },
});

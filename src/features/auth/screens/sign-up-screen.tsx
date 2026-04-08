import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ImagePickerAsset } from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AuthScreenShell } from "@/features/auth/components/auth-screen-shell";
import {
  clearAuthProfileCache,
  ensureAuthProfile,
  getAuthProfile,
} from "@/features/auth/lib/auth-profile";
import {
  isExistingAccountError,
  isInvalidCredentialsError,
  mapAuthErrorMessage,
  type AuthFieldErrors,
  validateSignUpForm,
} from "@/features/auth/lib/auth-form";
import { authClient } from "@/lib/auth-client";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { ensureImageLibraryPermission } from "@/lib/image-library-permission";
import { hp, rs } from "@/lib/responsive";

type AuthResponseError = {
  message?: string;
  status?: number;
} | null;

type SignUpResponse = {
  error?: AuthResponseError;
  data?: {
    user?: {
      image?: string | null;
    } | null;
  } | null;
};

type UpdateUserResponse = {
  error?: AuthResponseError;
};

type SessionUser = {
  id: string;
};

export function SignUpScreenView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLatestSessionUser = async () => {
    const latestSession = (await authClient.getSession()) as {
      data?: {
        user?: SessionUser | null;
      } | null;
    };

    return latestSession.data?.user ?? null;
  };

  const syncRestoredAuthUser = async (updates: {
    name?: string;
    image?: string;
  }) => {
    if (Object.keys(updates).length === 0) {
      return;
    }

    const updateUser = authClient.updateUser as (input: {
      name?: string;
      image?: string;
    }) => Promise<UpdateUserResponse>;

    const attemptSync = async () => updateUser(updates);

    let response = await attemptSync();

    if (response.error?.status === 401) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      response = await attemptSync();
    }

    if (response.error?.status === 401) {
      return;
    }

    if (response.error) {
      console.error(
        "Deleted account restored, but syncing the auth profile failed.",
        response.error,
      );
    }
  };

  const restoreDeletedAccount = async (
    trimmedName: string,
    trimmedEmail: string,
    profileImageUrl?: string,
  ) => {
    const signInResponse = await authClient.signIn.email({
      email: trimmedEmail,
      password,
      rememberMe: true,
    });

    if (signInResponse.error) {
      if (isInvalidCredentialsError(signInResponse.error.message)) {
        return {
          restored: false,
          error:
            "This email is already registered. Use the original password to restore it, or log in instead.",
        };
      }

      return {
        restored: false,
        error: mapAuthErrorMessage(signInResponse.error.message),
      };
    }

    const signedInUser = await getLatestSessionUser();

    if (!signedInUser) {
      return {
        restored: false,
        error: "Your account was found, but the session could not be restored.",
      };
    }

    const existingProfile = await getAuthProfile(signedInUser, { force: true });

    if (existingProfile) {
      clearAuthProfileCache(signedInUser.id);
      await authClient.signOut();

      return {
        restored: false,
        error: "An account with this email already exists. Log in instead.",
      };
    }

    const nextUserUpdates: {
      name?: string;
      image?: string;
    } = {};

    if (trimmedName) {
      nextUserUpdates.name = trimmedName;
    }

    if (profileImageUrl) {
      nextUserUpdates.image = profileImageUrl;
    }

    await ensureAuthProfile(signedInUser, { force: true });
    await syncRestoredAuthUser(nextUserUpdates);

    return {
      restored: true,
      error: null,
    };
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setFieldErrors((current) => ({ ...current, name: undefined }));
    setErrorMessage(null);
  };

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

  const handlePickImage = async () => {
    const hasPermission = await ensureImageLibraryPermission({
      featureName: "choose a profile image",
    });

    if (!hasPermission) {
      setErrorMessage("Photo permission is required to choose a profile image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    setErrorMessage(null);
    setSelectedImage(result.assets[0]);
  };

  const handleImageBadgePress = async (event: GestureResponderEvent) => {
    event.stopPropagation();

    if (selectedImage) {
      setSelectedImage(null);
      setErrorMessage(null);
      return;
    }

    await handlePickImage();
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) {
      return;
    }

    const nextFieldErrors = validateSignUpForm({ name, email, password });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage(null);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setErrorMessage(null);

    try {
      let profileImageUrl: string | undefined;

      if (selectedImage) {
        profileImageUrl = await uploadImageToCloudinary(selectedImage);
      }

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      const response = await (
        authClient.signUp.email as (input: {
          name: string;
          email: string;
          password: string;
          image?: string;
        }) => Promise<SignUpResponse>
      )({
        name: trimmedName,
        email: trimmedEmail,
        password,
        image: profileImageUrl,
      });

      const { error } = response;

      if (error) {
        if (isExistingAccountError(error.message)) {
          const restoreResult = await restoreDeletedAccount(
            trimmedName,
            trimmedEmail,
            profileImageUrl,
          );

          if (!restoreResult.restored) {
            setErrorMessage(restoreResult.error);
            setIsSubmitting(false);
            return;
          }

          router.replace("/select-currency");
          return;
        }

        setErrorMessage(mapAuthErrorMessage(error.message));
        setIsSubmitting(false);
        return;
      }

      if (profileImageUrl) {
        const persistedImage = response.data?.user?.image ?? null;

        if (persistedImage !== profileImageUrl) {
          const updateUserResponse = await (
            authClient.updateUser as (input: {
              image: string;
            }) => Promise<UpdateUserResponse>
          )({
            image: profileImageUrl,
          });

          if (updateUserResponse.error) {
            console.error(
              "Profile image uploaded, but persisting it on the user failed.",
              updateUserResponse.error,
            );
          }
        }
      }

      const signedInUser = await getLatestSessionUser();

      if (!signedInUser) {
        throw new Error("Account created, but the session could not be restored.");
      }

      await ensureAuthProfile(signedInUser, { force: true });
      router.replace("/select-currency");
    } catch (error) {
      setErrorMessage(
        mapAuthErrorMessage(error instanceof Error ? error.message : null),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      backHref="/get-started"
      heroMinHeight={hp(37)}
      heroContent={
        <View style={styles.heroAvatarWrap}>
          <Pressable onPress={handlePickImage} style={styles.heroAvatarPicker}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.heroAvatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.heroAvatarPlaceholder}>
                <Feather
                  name="camera"
                  size={rs(22)}
                  color={colors.primaryDark}
                />
              </View>
            )}
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={handleImageBadgePress}
            style={[
              styles.heroAvatarBadge,
              selectedImage ? styles.heroAvatarBadgeRemove : null,
            ]}
          >
            <Feather
              name={selectedImage ? "x" : "plus"}
              size={rs(14)}
              color={colors.white}
            />
          </Pressable>
        </View>
      }
    >
      <Text style={styles.title}>Join Spenza</Text>

      <View style={styles.form}>
        <AppInput
          label="Full Name"
          value={name}
          onChangeText={handleNameChange}
          placeholder="Jane Doe"
          autoCorrect={false}
          error={fieldErrors.name}
        />
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
          placeholder="Choose a password"
          secureTextEntry
          error={fieldErrors.password}
        />
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.actions}>
        <AppButton
          label={isSubmitting ? "Creating Account..." : "Create Account"}
          onPress={handleCreateAccount}
          disabled={isSubmitting}
          variant="hero"
          pill
        />
        <AppButton
          label="Already have an account? "
          hrefText="Log In"
          variant="text"
          onPress={() => router.push("/sign-in")}
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  heroAvatarWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  heroAvatarPicker: {
    width: "84%",
    height: "84%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "#EEF8F7",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  heroAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarImage: {
    width: "100%",
    height: "100%",
  },
  heroAvatarBadge: {
    position: "absolute",
    right: spacing.xxs,
    bottom: spacing.xxs,
    width: rs(28, 0.94, 1.04),
    height: rs(28, 0.94, 1.04),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
    zIndex: 2,
  },
  heroAvatarBadgeRemove: {
    backgroundColor: colors.danger,
  },
  title: {
    fontSize: rs(26, 0.95, 1.05),
    lineHeight: rs(32, 0.95, 1.05),
    fontWeight: "800",
    color: colors.primaryDark,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
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

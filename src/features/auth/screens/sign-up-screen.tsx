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
import { authClient } from "@/lib/auth-client";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { ensureImageLibraryPermission } from "@/lib/image-library-permission";
import { rs } from "@/lib/responsive";

type AuthResponseError = {
  message?: string;
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

export function SignUpScreenView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let profileImageUrl: string | undefined;

      if (selectedImage) {
        profileImageUrl = await uploadImageToCloudinary(selectedImage);
      }

      const response = await (
        authClient.signUp.email as (input: {
          name: string;
          email: string;
          password: string;
          image?: string;
        }) => Promise<SignUpResponse>
      )({
        name,
        email,
        password,
        image: profileImageUrl,
      });

      const { error } = response;

      if (error) {
        setErrorMessage(error.message ?? "Unable to create account.");
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

      router.replace("/select-currency");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create account right now.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      backHref="/get-started"
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
      <Text style={styles.title}>Join Spendora</Text>

      <View style={styles.form}>
        <AppInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
        />
        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Choose a password"
          secureTextEntry
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
          label="Already have an account? Log In"
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

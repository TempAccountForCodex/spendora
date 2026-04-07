import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/branding/user-avatar";
import { HeroScreen } from "@/components/layout/hero-screen";
import { AppButton } from "@/components/ui/app-button";
import { colors, gradients, radius, spacing, typography } from "@/constants/theme";
import { clearAuthProfileCache } from "@/features/auth/lib/auth-profile";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { authClient } from "@/lib/auth-client";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { getCurrencyLabel, getUserCurrencyCode } from "@/lib/currency";
import { ensureImageLibraryPermission } from "@/lib/image-library-permission";
import { hp, rs } from "@/lib/responsive";
import { useAppDispatch } from "@/store/hooks";
import { clearExpensesState } from "@/store/slices/expenses-slice";

function buildHandle(name: string | null | undefined) {
  if (!name) {
    return "@spendora_user";
  }

  return `@${name.trim().toLowerCase().replace(/\s+/g, "_")}`;
}

export function ProfileScreenView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, refetch } = useAuthSession();
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const currencyCode = getUserCurrencyCode(user?.currency);
  const currencyLabel = getCurrencyLabel(user?.currency);
  const handle = buildHandle(user?.name);

  const handleSignOut = async () => {
    clearAuthProfileCache(user?.id);
    await authClient.signOut();
    dispatch(clearExpensesState());
    router.replace("/get-started");
  };

  const handleUpdateProfileImage = async () => {
    if (isUpdatingImage) {
      return;
    }

    const hasPermission = await ensureImageLibraryPermission({
      featureName: "update your profile image",
    });

    if (!hasPermission) {
      setImageError("Photo permission is required to update your profile image.");
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

    setIsUpdatingImage(true);
    setImageError(null);

    try {
      const imageUrl = await uploadImageToCloudinary(result.assets[0]);

      const updateUserResponse = await (
        authClient.updateUser as (input: {
          image: string;
        }) => Promise<{
          error?: {
            message?: string;
          } | null;
        }>
      )({
        image: imageUrl,
      });

      if (updateUserResponse.error) {
        throw new Error(updateUserResponse.error.message ?? "Unable to update profile image.");
      }

      await refetch();
    } catch (error) {
      setImageError(
        error instanceof Error
          ? error.message
          : "Unable to update profile image right now.",
      );
    } finally {
      setIsUpdatingImage(false);
    }
  };

  return (
    <HeroScreen>
      {(topInset) => (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={gradients.splash}
            style={[styles.hero, { paddingTop: topInset + spacing.lg }]}
          >
            <View style={styles.profileCard}>
              <Pressable
                onPress={() => void handleUpdateProfileImage()}
                style={styles.avatarPressable}
              >
                <UserAvatar
                  uri={user?.image}
                  name={user?.name}
                  size={rs(92)}
                  style={styles.heroAvatar}
                />

                <View style={styles.avatarBadge}>
                  {isUpdatingImage ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Feather name="camera" size={rs(14)} color={colors.white} />
                  )}
                </View>
              </Pressable>
              <Text style={styles.heroTitle}>{user?.name ?? "Spendora User"}</Text>
              <Text style={styles.heroSubtitle}>{handle}</Text>
              {/* <Text style={styles.heroHint}>
                {isUpdatingImage ? "Updating photo..." : "Tap photo to update"}
              </Text> */}
              {imageError ? <Text style={styles.heroError}>{imageError}</Text> : null}
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Account Details</Text>
              <Text style={styles.cardSubtitle}>
                Manage your personal account information.
              </Text>
            </View>

            <View style={styles.detailsGroup}>
              <ProfileRow icon="mail" label="Email" value={user?.email ?? "-"} />
              <ProfileRow
                icon="credit-card"
                label="Currency"
                value={`${currencyLabel} (${currencyCode})`}
              />
              <ProfileRow icon="briefcase" label="Account" value="Personal" />
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              label="Sign Out"
              onPress={handleSignOut}
              variant="secondary"
              pill
            />
          </View>
        </ScrollView>
      )}
    </HeroScreen>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIconWrap}>
        <Feather name={icon} size={rs(17)} color={colors.primaryDark} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingBottom: hp(14),
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  avatarPressable: {
    position: "relative",
  },
  heroAvatar: {
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: colors.white,
  },
  avatarBadge: {
    position: "absolute",
    right: rs(-4),
    bottom: rs(-2),
    width: rs(28),
    height: rs(28),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
    borderWidth: 2,
    borderColor: colors.white,
  },
  heroTitle: {
    fontSize: rs(26),
    lineHeight: rs(32),
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
  },
  heroHint: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
  heroError: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.white,
    textAlign: "center",
  },
  card: {
    marginTop: -spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 4,
  },
  cardHeader: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.title,
    lineHeight: typography.titleLineHeight,
    fontWeight: "800",
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
  },
  detailsGroup: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  rowIconWrap: {
    width: rs(40),
    height: rs(40),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF8F6",
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowLabel: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
  },
  rowValue: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontWeight: "700",
    color: colors.text,
  },
  actions: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
});

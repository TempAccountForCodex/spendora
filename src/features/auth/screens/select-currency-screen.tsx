import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/app-button";
import {
  supportedCurrencies,
  type SupportedCurrencyCode,
} from "@/constants/currencies";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AuthScreenShell } from "@/features/auth/components/auth-screen-shell";
import { getAuthenticatedRoute } from "@/features/auth/lib/get-authenticated-route";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { authClient } from "@/lib/auth-client";
import { rs } from "@/lib/responsive";

type CurrencyOptionCardProps = {
  code: SupportedCurrencyCode;
  label: string;
  symbol: string;
  isActive: boolean;
  onPress: () => void;
};

function CurrencyOptionCard({
  code,
  label,
  symbol,
  isActive,
  onPress,
}: CurrencyOptionCardProps) {
  const selection = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selection, {
      toValue: isActive ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isActive, selection]);

  const cardOverlayStyle = {
    opacity: selection,
  };

  const contentStyle = {
    transform: [
      {
        scale: selection.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
      {
        translateY: selection.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        }),
      },
    ],
  };

  const symbolFillStyle = {
    opacity: selection,
  };

  const checkBadgeStyle = {
    opacity: selection,
    transform: [
      {
        scale: selection.interpolate({
          inputRange: [0, 1],
          outputRange: [0.68, 1],
        }),
      },
    ],
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.currencyCard,
        isActive ? styles.currencyCardActive : null,
        pressed ? styles.currencyCardPressed : null,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.currencyCardFill, cardOverlayStyle]}
      />

      <Animated.View style={[styles.currencyCardContent, contentStyle]}>
        <View style={styles.currencyCardHeader}>
          <View style={styles.symbolWrap}>
            <Animated.View
              pointerEvents="none"
              style={[styles.symbolFill, symbolFillStyle]}
            />
            <Text
              style={[
                styles.symbolText,
                isActive ? styles.symbolTextActive : null,
              ]}
            >
              {symbol}
            </Text>
          </View>

          <Animated.View style={[styles.checkBadge, checkBadgeStyle]}>
            <Feather name="check" size={rs(12)} color={colors.white} />
          </Animated.View>
        </View>

        <Text
          style={[
            styles.currencyCode,
            isActive ? styles.currencyCodeActive : null,
          ]}
        >
          {code}
        </Text>
        <Text
          style={[
            styles.currencyName,
            isActive ? styles.currencyNameActive : null,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function SelectCurrencyScreenView() {
  const router = useRouter();
  const { user, isPending, isSignedIn, refetch } = useAuthSession();
  const [currency, setCurrency] = useState<SupportedCurrencyCode>("USD");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && !isSignedIn) {
      router.replace("/get-started");
      return;
    }

    if (!isPending && isSignedIn) {
      const nextRoute = getAuthenticatedRoute(
        user as { currency?: string | null } | null,
      );

      if (nextRoute === "/(tabs)/home") {
        router.replace("/(tabs)/home");
      }
    }
  }, [isPending, isSignedIn, router, user]);

  const handleSaveCurrency = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await (
        authClient as unknown as {
          updateUser: (input: {
            currency: SupportedCurrencyCode;
          }) => Promise<{
            error?: {
              message?: string;
            } | null;
          }>;
        }
      ).updateUser({
        currency,
      });

      if (response.error) {
        setErrorMessage(
          response.error.message ?? "Unable to save your currency.",
        );
        setIsSubmitting(false);
        return;
      }

      await refetch();
      router.replace("/(tabs)/home");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your currency.",
      );
      setIsSubmitting(false);
    }
  };

  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <AuthScreenShell
      title={firstName ? `Welcome, ${firstName}` : "Welcome"}
      subtitle="Pick your currency."
      heroContent={
        <Image
          source={require("../../../../assets/images/app_icon.png")}
          style={styles.heroLogo}
          contentFit="cover"
        />
      }
    >
      <View style={styles.currencyGrid}>
        {supportedCurrencies.map((option) => (
          <CurrencyOptionCard
            key={option.code}
            code={option.code}
            label={option.label}
            symbol={option.symbol}
            isActive={currency === option.code}
            onPress={() => setCurrency(option.code)}
          />
        ))}
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.actions}>
        <AppButton
          label={isSubmitting ? "Saving..." : "Continue"}
          onPress={handleSaveCurrency}
          disabled={isSubmitting}
          variant="hero"
          pill
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  heroLogo: {
    width: "100%",
    height: "100%",
    borderRadius: radius.pill,
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: spacing.md,
  },
  currencyCard: {
    width: "45%",
    minHeight: rs(98, 0.92, 1.02),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    overflow: "hidden",
  },
  currencyCardActive: {
    borderColor: colors.primaryDark,
  },
  currencyCardPressed: {
    opacity: 0.96,
  },
  currencyCardFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceMuted,
  },
  currencyCardContent: {
    flex: 1,
  },
  currencyCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  symbolWrap: {
    minWidth: rs(34, 0.92, 1.02),
    height: rs(34, 0.92, 1.02),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF8F7",
    overflow: "hidden",
  },
  symbolFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryDark,
  },
  symbolText: {
    fontSize: rs(13, 0.92, 1.02),
    lineHeight: rs(16, 0.92, 1.02),
    fontWeight: "700",
    color: colors.primaryDark,
  },
  symbolTextActive: {
    color: colors.white,
  },
  checkBadge: {
    width: rs(18, 0.92, 1.02),
    height: rs(18, 0.92, 1.02),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
  },
  currencyCode: {
    fontSize: rs(16, 0.92, 1.02),
    lineHeight: rs(19, 0.92, 1.02),
    fontWeight: "800",
    color: colors.text,
  },
  currencyCodeActive: {
    color: colors.primaryDark,
  },
  currencyName: {
    marginTop: spacing.xxs,
    fontSize: rs(12, 0.92, 1.02),
    lineHeight: rs(16, 0.92, 1.02),
    color: colors.textMuted,
  },
  currencyNameActive: {
    color: colors.primaryDark,
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

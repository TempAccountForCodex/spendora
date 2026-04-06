import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { appBrand } from "@/constants/branding";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";
import { rs } from "@/lib/responsive";

type AppLogoProps = {
  caption?: string;
};

export function AppLogo({ caption }: AppLogoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.markFrame}>
        <Image
          source={appBrand.assets.logoMark}
          style={styles.mark}
          contentFit="contain"
          transition={250}
        />
      </View>

      <View style={styles.wordmarkFrame}>
        <Image
          source={appBrand.assets.logoWordmark}
          style={styles.wordmark}
          contentFit="contain"
          transition={250}
        />
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
  },
  markFrame: {
    width: rs(120),
    height: rs(120),
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    ...shadows.card,
  },
  mark: {
    width: rs(88),
    height: rs(60),
  },
  wordmarkFrame: {
    minHeight: rs(48),
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wordmark: {
    width: rs(168),
    height: rs(26),
  },
  caption: {
    maxWidth: rs(280),
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    textAlign: "center",
    color: colors.textMuted,
  },
});

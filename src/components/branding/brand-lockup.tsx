import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { appBrand } from "@/constants/branding";
import { colors, radius, spacing } from "@/constants/theme";
import { rs } from "@/lib/responsive";

type BrandLockupProps = {
  size?: "medium" | "large";
  variant?: "plain" | "glass";
  part?: "full" | "mark" | "wordmark";
};

export function BrandLockup({
  size = "medium",
  variant = "plain",
  part = "full",
}: BrandLockupProps) {
  const isLarge = size === "large";
  const showGlass = variant === "glass";

  const mark = (
    <View
      style={[
        styles.markWrap,
        isLarge ? styles.markWrapLarge : styles.markWrapMedium,
        showGlass ? styles.markGlassSurface : null,
      ]}
    >
      <Image
        source={appBrand.assets.logoMark}
        style={[styles.mark, isLarge ? styles.markLarge : styles.markMedium]}
        contentFit="contain"
        transition={250}
      />
    </View>
  );

  const wordmark = (
    <View
      style={[
        styles.wordmarkWrap,
        isLarge ? styles.wordmarkWrapLarge : styles.wordmarkWrapMedium,
        showGlass ? styles.wordmarkGlassSurface : null,
      ]}
    >
      <Image
        source={appBrand.assets.logoWordmark}
        style={[
          styles.wordmark,
          isLarge ? styles.wordmarkLarge : styles.wordmarkMedium,
        ]}
        contentFit="contain"
        transition={250}
      />
    </View>
  );

  if (part === "mark") {
    return mark;
  }

  if (part === "wordmark") {
    return wordmark;
  }

  return (
    <View style={styles.container}>
      {mark}
      {wordmark}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.lg,
  },
  markWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  markWrapMedium: {
    width: rs(144),
    height: rs(104),
  },
  markWrapLarge: {
    width: rs(188),
    height: rs(136),
  },
  markGlassSurface: {
    borderRadius: radius.xl,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  mark: {
    width: "100%",
    height: "100%",
  },
  markMedium: {
    width: rs(144),
    height: rs(104),
  },
  markLarge: {
    width: rs(188),
    height: rs(136),
  },
  wordmarkWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  wordmarkWrapMedium: {
    minHeight: rs(44),
    paddingHorizontal: spacing.md,
  },
  wordmarkWrapLarge: {
    minHeight: rs(52),
    paddingHorizontal: spacing.lg,
  },
  wordmarkGlassSurface: {
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  wordmark: {
    height: rs(28),
  },
  wordmarkMedium: {
    width: rs(184),
    height: rs(28),
  },
  wordmarkLarge: {
    width: rs(220),
    height: rs(34),
  },
});

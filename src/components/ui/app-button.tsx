import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  colors,
  gradients,
  layout,
  radius,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";

type AppButtonProps = {
  label: string;
  hrefText?: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "text" | "hero";
  icon?: ReactNode;
  disabled?: boolean;
  pill?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function AppButton({
  label,
  hrefText,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  pill = false,
  style,
  contentStyle,
  labelStyle,
}: AppButtonProps) {
  const isHero = variant === "hero";
  const isText = variant === "text";
  const isPill = pill || isHero;

  const content = (
    <>
      {icon}
      <Text
        style={[
          styles.label,
          variant === "primary" ? styles.primaryLabel : null,
          variant === "secondary" ? styles.secondaryLabel : null,
          variant === "ghost" ? styles.ghostLabel : null,
          variant === "text" ? styles.textLabel : null,
          variant === "hero" ? styles.heroLabel : null,
          labelStyle,
        ]}
      >
        {label}
        {hrefText ? <Text style={styles.hrefText}>{hrefText}</Text> : null}
      </Text>
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        isText ? styles.textPressable : styles.blockPressable,
        variant === "primary" ? styles.primaryShadow : null,
        variant === "hero" ? styles.heroShadow : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {isHero ? (
        <View style={styles.heroWrap}>
          <View
            pointerEvents="none"
            style={[
              styles.heroGlow,
              isPill ? styles.pill : styles.rounded,
            ]}
          />
          <LinearGradient
            colors={gradients.buttonHero}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.content,
              styles.heroContent,
              isPill ? styles.pill : styles.rounded,
              contentStyle,
            ]}
          >
            {content}
          </LinearGradient>
        </View>
      ) : (
        <View
          style={[
            styles.content,
            isPill ? styles.pill : styles.rounded,
            variant === "primary" ? styles.primaryContent : null,
            variant === "secondary" ? styles.secondaryContent : null,
            variant === "ghost" ? styles.ghostContent : null,
            variant === "text" ? styles.textContent : null,
            contentStyle,
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "stretch",
  },
  blockPressable: {
    width: "100%",
  },
  textPressable: {
    width: "auto",
    alignSelf: "center",
  },
  content: {
    minHeight: layout.buttonMinHeight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  rounded: {
    borderRadius: radius.md,
  },
  pill: {
    borderRadius: radius.pill,
  },
  primaryShadow: {
    ...shadows.card,
  },
  heroShadow: {
    shadowColor: "#3E7C78",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  primaryContent: {
    backgroundColor: colors.primary,
  },
  secondaryContent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostContent: {
    backgroundColor: "transparent",
  },
  textContent: {
    minHeight: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
  },
  heroContent: {
    minHeight: layout.buttonMinHeight,
  },
  heroWrap: {
    position: "relative",
  },
  heroGlow: {
    position: "absolute",
    left: 24,
    right: 24,
    top: 42,
    bottom: -4,
    backgroundColor: "rgba(62, 124, 120, 0.14)",
    shadowColor: "#3E7C78",
    shadowOpacity: 0.38,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 1,
    transform: [{ scaleY: 0.62 }],
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  hrefText: {
    color: colors.primaryDark,
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.text,
  },
  ghostLabel: {
    color: colors.primaryDark,
  },
  textLabel: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.text,
  },
  heroLabel: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: "700",
  },
});

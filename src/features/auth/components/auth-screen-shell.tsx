import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type Href, useRouter } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HeroScreen } from "@/components/layout/hero-screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { hp, rs, wp } from "@/lib/responsive";

type AuthScreenShellProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  heroContent?: ReactNode;
  backHref?: Href;
}>;

export function AuthScreenShell({
  title,
  subtitle,
  heroContent,
  backHref,
  children,
}: AuthScreenShellProps) {
  const router = useRouter();
  const hasHeaderCopy = Boolean(title || subtitle);

  return (
    <HeroScreen backgroundColor="#EEF8F7" statusBarStyle="dark">
      {(topInset) => (
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.hero, { paddingTop: topInset + hp(1) }]}>
              {backHref ? (
                <Pressable
                  onPress={() => router.push(backHref)}
                  style={({ pressed }) => [
                    styles.backButton,
                    { top: topInset + hp(1.1) },
                    pressed ? styles.backButtonPressed : null,
                  ]}
                >
                  <Feather name="chevron-left" size={rs(22)} color={colors.primaryDark} />
                </Pressable>
              ) : null}

              <View style={[styles.ring, styles.ringOne]} />
              <View style={[styles.ring, styles.ringTwo]} />
              <View style={[styles.ring, styles.ringThree]} />

              <View style={styles.brandOrb}>
                {heroContent ?? (
                  <Image
                    source={require("../../../../assets/images/logo-img.webp")}
                    style={styles.logo}
                    contentFit="contain"
                  />
                )}
              </View>
            </View>

            <View style={styles.contentSection}>
              <View style={styles.slant} pointerEvents="none" />

              <View style={styles.content}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                <View style={[styles.body, !hasHeaderCopy ? styles.bodyCompact : null]}>
                  {children}
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.white,
  },
  hero: {
    position: "relative",
    minHeight: hp(38),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF8F7",
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    left: rs(18, 0.95, 1.05),
    zIndex: 5,
    width: rs(42, 0.95, 1.05),
    height: rs(42, 0.95, 1.05),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  ring: {
    position: "absolute",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.58)",
    borderRadius: radius.pill,
  },
  ringOne: {
    top: -hp(8),
    width: wp(120),
    height: wp(120),
  },
  ringTwo: {
    top: hp(1),
    width: wp(88),
    height: wp(88),
  },
  ringThree: {
    top: hp(8),
    width: wp(58),
    height: wp(58),
  },
  brandOrb: {
    width: rs(116, 0.92, 1.08),
    height: rs(116, 0.92, 1.08),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    overflow: "visible",
  },
  logo: {
    width: rs(84, 0.92, 1.08),
    height: rs(84, 0.92, 1.08),
  },
  contentSection: {
    position: "relative",
    backgroundColor: colors.white,
    marginTop: -hp(3.2),
    overflow: "hidden",
  },
  slant: {
    position: "absolute",
    top: -hp(6),
    left: -wp(14),
    width: wp(136),
    height: hp(13),
    backgroundColor: colors.white,
    transform: [{ rotate: "-6.5deg" }],
  },
  content: {
    paddingHorizontal: rs(24, 0.95, 1.05),
    paddingTop: hp(4.6),
    paddingBottom: hp(3.2),
  },
  title: {
    fontSize: rs(28, 0.95, 1.05),
    lineHeight: rs(34, 0.95, 1.05),
    fontWeight: "800",
    textAlign: "center",
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    textAlign: "center",
    color: colors.textMuted,
  },
  body: {
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
  bodyCompact: {
    marginTop: 0,
  },
});

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import {
  colors,
  radius,
  spacing,
} from "@/constants/theme";
import { getAuthenticatedRoute } from "@/features/auth/lib/get-authenticated-route";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { hp, rs, wp } from "@/lib/responsive";

export function GetStartedScreenView() {
  const router = useRouter();
  const { isSignedIn, isPending, user } = useAuthSession();

  useEffect(() => {
    if (!isPending && isSignedIn) {
      router.replace(
        getAuthenticatedRoute(user as { currency?: string | null } | null),
      );
    }
  }, [isPending, isSignedIn, router, user]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "right", "bottom", "left"]}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <View style={styles.hero}>
          <View style={[styles.ring, styles.ringOne]} />
          <View style={[styles.ring, styles.ringTwo]} />
          <View style={[styles.ring, styles.ringThree]} />
          <View style={[styles.ring, styles.ringFour]} />

          <Image
            source={require("../../../../assets/images/get_started.png")}
            style={styles.heroFigure}
            contentFit="contain"
          />
          <Image
            source={require("../../../../assets/images/Coint.png")}
            style={styles.coin}
            contentFit="contain"
          />
          <Image
            source={require("../../../../assets/images/Donut.png")}
            style={styles.donut}
            contentFit="contain"
          />
        </View>

        <View style={styles.contentSection}>
          <View style={styles.slant} pointerEvents="none" />

          <View style={styles.content}>
            <Text style={styles.title}>Spend Smarter{"\n"}Save More</Text>

            <AppButton
              label="Get Started"
              onPress={() => router.push("/sign-up")}
              variant="hero"
              pill
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
            />

            <AppButton
              label="Already Have Account? Log In"
              variant="text"
              onPress={() => router.push("/sign-in")}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF8F7",
  },
  screen: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  hero: {
    position: "relative",
    minHeight: hp(60),
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#EEF8F7",
    overflow: "visible",
    paddingTop: hp(1.5),
  },
  ring: {
    position: "absolute",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.55)",
    borderRadius: radius.pill,
  },
  ringOne: {
    top: -hp(13),
    width: wp(142),
    height: wp(142),
  },
  ringTwo: {
    top: -hp(2),
    width: wp(118),
    height: wp(118),
  },
  ringThree: {
    top: hp(7.5),
    width: wp(92),
    height: wp(92),
  },
  ringFour: {
    top: hp(17),
    width: wp(66),
    height: wp(66),
  },
  heroFigure: {
    width: wp(84),
    height: hp(49.5),
    maxWidth: 390,
    maxHeight: 520,
    zIndex: 2,
  },
  coin: {
    position: "absolute",
    top: hp(11.5),
    left: wp(12.5),
    width: rs(74, 0.88, 1.12),
    height: rs(74, 0.88, 1.12),
    zIndex: 3,
  },
  donut: {
    position: "absolute",
    top: hp(14.5),
    right: wp(13),
    width: rs(70, 0.88, 1.1),
    height: rs(70, 0.88, 1.1),
    zIndex: 3,
  },
  contentSection: {
    position: "relative",
    flex: 1,
    backgroundColor: colors.white,
    marginTop: -hp(5.8),
    overflow: "hidden",
  },
  slant: {
    position: "absolute",
    top: -hp(8),
    left: -wp(16),
    width: wp(136),
    height: hp(17),
    backgroundColor: colors.white,
    transform: [{ rotate: "-6.5deg" }],
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: rs(24, 0.95, 1.05),
    paddingTop: hp(6.1),
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: rs(30, 0.94, 1.06),
    lineHeight: rs(36, 0.94, 1.06),
    fontWeight: "800",
    textAlign: "center",
    color: colors.primaryDark,
    letterSpacing: -0.6,
    marginBottom: hp(5),
  },
  primaryButton: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  primaryButtonContent: {
    minHeight: hp(7.4),
  },
});

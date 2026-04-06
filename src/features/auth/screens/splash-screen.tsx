import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { colors, gradients, motion } from "@/constants/theme";
import { getAuthenticatedRoute } from "@/features/auth/lib/get-authenticated-route";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { hp, rs, wp } from "@/lib/responsive";

export function SplashScreenView() {
  const router = useRouter();
  const { isSignedIn, isPending, user } = useAuthSession();
  const hasAnimated = useRef(false);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const nextRoute: Href = isSignedIn
    ? getAuthenticatedRoute(user as { currency?: string | null } | null)
    : "/get-started";

  useEffect(() => {
    if (isPending || hasAnimated.current) {
      return;
    }

    hasAnimated.current = true;

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: motion.normal,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: motion.normal,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoScale, {
        toValue: 200,
        duration: motion.splashDelay,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        router.replace(nextRoute);
      }
    });

    return () => {
      animation.stop();
      hasAnimated.current = false;
    };
  }, [isPending, logoOpacity, logoScale, nextRoute, router]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={gradients.splash}
        start={{ x: 0.06, y: 0.04 }}
        end={{ x: 0.94, y: 1 }}
        style={styles.container}
      >
        <LinearGradient
          colors={gradients.splashHighlight}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientLayer, styles.highlightLayer]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={gradients.splashDepth}
          start={{ x: 0.3, y: 0.1 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientLayer, styles.depthLayer]}
          pointerEvents="none"
        />

        <Animated.View
          style={[
            styles.logoStage,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("../../../../assets/images/logo-img.webp")}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.brandPanel,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientLayer: {
    position: "absolute",
  },
  highlightLayer: {
    top: -hp(14),
    left: -wp(20),
    width: wp(68),
    height: wp(68),
    borderRadius: wp(68),
  },
  depthLayer: {
    right: -wp(36),
    bottom: -hp(20),
    width: wp(90),
    height: wp(90),
    borderRadius: wp(90),
  },
  logoStage: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: rs(168, 0.75, 1.05),
    height: rs(168, 0.75, 1.05),
  },
});

import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";

type HeroScreenProps = {
  children: ReactNode | ((topInset: number) => ReactNode);
  statusBarStyle?: "light" | "dark";
  backgroundColor?: string;
};

export function HeroScreen({
  children,
  statusBarStyle = "light",
  backgroundColor = colors.white,
}: HeroScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar style={statusBarStyle} translucent backgroundColor="transparent" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor }}
        edges={["left", "right", "bottom"]}
      >
        {typeof children === "function" ? children(insets.top) : children}
      </SafeAreaView>
    </View>
  );
}

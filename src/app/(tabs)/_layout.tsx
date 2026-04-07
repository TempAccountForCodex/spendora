import { Feather } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Redirect, Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadows, spacing } from "@/constants/theme";
import { getAuthenticatedRoute } from "@/features/auth/lib/get-authenticated-route";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { rs } from "@/lib/responsive";

function AddTabButton({ onPress }: BottomTabBarButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.addTabButton}>
      <View style={styles.addTabInner}>
        <Feather name="plus" size={rs(26)} color={colors.white} />
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isPending, isSignedIn, user } = useAuthSession();

  if (isPending) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/get-started" />;
  }

  const nextRoute = getAuthenticatedRoute(user);

  if (nextRoute !== "/(tabs)/home") {
    return <Redirect href={nextRoute} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: "#B9C4C8",
        transitionSpec: {
          animation: "timing",
          config: {
            duration: 180,
          },
        },
        sceneStyle: {
          backgroundColor: colors.white,
        },
        tabBarStyle: {
          height: rs(55) + Math.max(insets.bottom, spacing.sm),
          paddingTop: spacing.sm,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          backgroundColor: colors.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          ...shadows.card,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={rs(22)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="bar-chart-2" size={rs(22)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarButton: (props) => <AddTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={rs(22)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={rs(22)} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -rs(24),
  },
  addTabInner: {
    width: rs(68),
    height: rs(68),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.26,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
  },
});

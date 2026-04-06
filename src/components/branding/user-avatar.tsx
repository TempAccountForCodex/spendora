import { Image } from "expo-image";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "@/constants/theme";

type UserAvatarProps = {
  uri?: string | null;
  name?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
};

function getInitials(name: string | null | undefined) {
  if (!name) {
    return "S";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserAvatar({ uri, name, size, style }: UserAvatarProps) {
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: Math.max(13, size * 0.34),
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  initials: {
    fontWeight: "800",
    color: colors.primaryDark,
  },
});

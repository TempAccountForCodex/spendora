import * as ImagePicker from "expo-image-picker";
import { Alert, Linking, Platform } from "react-native";

type EnsureImageLibraryPermissionOptions = {
  featureName: string;
};

export async function ensureImageLibraryPermission({
  featureName,
}: EnsureImageLibraryPermissionOptions) {
  // Android's system photo picker can provide one-off image access without
  // requesting broad media-library permissions up front.
  if (Platform.OS === "android" || Platform.OS === "web") {
    return true;
  }

  const existingPermission =
    await ImagePicker.getMediaLibraryPermissionsAsync(false);

  if (existingPermission.granted) {
    return true;
  }

  const permission = existingPermission.canAskAgain
    ? await ImagePicker.requestMediaLibraryPermissionsAsync(false)
    : existingPermission;

  if (permission.granted) {
    return true;
  }

  Alert.alert(
    "Photo access required",
    `Allow photo library access in Settings so you can ${featureName}.`,
    [
      {
        text: "Not now",
        style: "cancel",
      },
      ...(permission.canAskAgain
        ? []
        : [
            {
              text: "Open Settings",
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ]),
    ],
  );

  return false;
}

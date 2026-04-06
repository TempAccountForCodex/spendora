import type { ImagePickerAsset } from "expo-image-picker";

const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "spendora_app";

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: {
    message?: string;
  };
};

export function isCloudinaryConfigured() {
  return Boolean(cloudName);
}

export async function uploadImageToCloudinary(asset: ImagePickerAsset) {
  if (!cloudName) {
    throw new Error(
      "Missing EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME in .env for profile photo uploads.",
    );
  }

  const formData = new FormData();
  const mimeType = asset.mimeType ?? "image/jpeg";
  const extension = mimeType.split("/")[1] ?? "jpg";
  const fileName = asset.fileName ?? `spendora-avatar-${Date.now()}.${extension}`;

  formData.append("upload_preset", uploadPreset);

  // Prefer base64 when available because picker file URIs are less reliable on Android.
  if (asset.base64) {
    formData.append("file", `data:${mimeType};base64,${asset.base64}`);
  } else {
    formData.append(
      "file",
      {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as never,
    );
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message ?? "Unable to upload profile image.");
  }

  return payload.secure_url;
}

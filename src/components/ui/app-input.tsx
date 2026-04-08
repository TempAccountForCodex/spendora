import type { ComponentProps } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
  colors,
  layout,
  radius,
  spacing,
  typography,
} from "@/constants/theme";

type AppInputProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string | null;
};

export function AppInput({ label, error, ...props }: AppInputProps) {
  const { style, ...inputProps } = props;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textPlaceholder}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    minHeight: layout.inputMinHeight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: typography.body,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.danger,
  },
});

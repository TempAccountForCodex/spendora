import { hp, rHorizontal, rs, rVertical, wp } from "@/lib/responsive";

const palette = {
  white: "#FFFFFF",
  canvas: "#F7F8F4",
  ink: "#14242B",
  slate: "#60747D",
  teal400: "#79C7C0",
  teal500: "#63B7B1",
  teal600: "#53A7A1",
  teal700: "#3C8A85",
  mint100: "#E6F3F1",
  mint200: "#D7EBE8",
  green500: "#16A34A",
  red500: "#DC2626",
};

export const theme = {
  colors: {
    background: palette.canvas,
    surface: palette.white,
    surfaceMuted: palette.mint100,
    primary: palette.teal600,
    primaryDark: palette.teal700,
    primarySoft: palette.mint200,
    brandPanel: palette.teal500,
    brandPanelDark: palette.teal700,
    brandGlow: "rgba(255, 255, 255, 0.16)",
    glass: "rgba(255, 255, 255, 0.18)",
    glassBorder: "rgba(255, 255, 255, 0.3)",
    ring: "rgba(83, 167, 161, 0.1)",
    text: palette.ink,
    textMuted: palette.slate,
    border: "#D8E6E3",
    success: palette.green500,
    danger: palette.red500,
    white: palette.white,
    shadow: "rgba(20, 36, 43, 0.14)",
  },
  gradients: {
    splash: [
      palette.teal400,
      palette.teal500,
      palette.teal600,
      palette.teal700,
    ] as const,
    buttonHero: [
      "#69AEA9",
      "#3F8782",
    ] as const,
    splashHighlight: [
      "rgba(255, 255, 255, 0.22)",
      "rgba(255, 255, 255, 0)",
    ] as const,
    splashDepth: [
      "rgba(20, 36, 43, 0)",
      "rgba(20, 36, 43, 0.12)",
    ] as const,
  },
  spacing: {
    xxs: rs(4),
    xs: rs(8),
    sm: rs(12),
    md: rs(16),
    lg: rs(24),
    xl: rs(32),
    xxl: rs(40),
    xxxl: rs(56),
  },
  radius: {
    sm: rs(12),
    md: rs(18),
    lg: rs(24),
    xl: rs(32),
    pill: 999,
  },
  typography: {
    display: rs(40),
    heading: rs(32),
    title: rs(18),
    body: rs(16),
    caption: rs(14),
    label: rs(13),
    bodyLineHeight: rs(24),
    captionLineHeight: rs(20),
    titleLineHeight: rs(28),
  },
  layout: {
    screenPadding: rHorizontal(24),
    maxContentWidth: Math.min(wp(90), 420),
    splashPanelRatio: 0.72,
    buttonMinHeight: rVertical(56),
    inputMinHeight: rVertical(54),
  },
  motion: {
    fast: 220,
    normal: 420,
    splashDelay: 1500,
  },
  shadows: {
    card: {
      shadowColor: palette.ink,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: hp(1.2),
      },
      elevation: 4,
    },
    floating: {
      shadowColor: palette.ink,
      shadowOpacity: 0.14,
      shadowRadius: 28,
      shadowOffset: {
        width: 0,
        height: hp(2),
      },
      elevation: 8,
    },
  },
};

export const {
  colors,
  gradients,
  spacing,
  radius,
  typography,
  layout,
  motion,
  shadows,
} = theme;

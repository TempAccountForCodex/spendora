import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

function normalizePercent(value: number | string) {
  return typeof value === "number" ? `${value}%` : value;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function wp(value: number | string) {
  return widthPercentageToDP(normalizePercent(value));
}

export function hp(value: number | string) {
  return heightPercentageToDP(normalizePercent(value));
}

export function rHorizontal(
  size: number,
  minFactor = 0.9,
  maxFactor = 1.2,
) {
  const scaled = wp((size / BASE_WIDTH) * 100);

  return Math.round(clamp(scaled, size * minFactor, size * maxFactor));
}

export function rVertical(size: number, minFactor = 0.9, maxFactor = 1.2) {
  const scaled = hp((size / BASE_HEIGHT) * 100);

  return Math.round(clamp(scaled, size * minFactor, size * maxFactor));
}

export function rs(size: number, minFactor = 0.9, maxFactor = 1.2) {
  const scaled = (rHorizontal(size, minFactor, maxFactor) +
    rVertical(size, minFactor, maxFactor)) /
    2;

  return Math.round(clamp(scaled, size * minFactor, size * maxFactor));
}

import { TextStyle } from "react-native";

export const colors = {
  bg: "#0A0A0B",
  surface: "#141416",
  surfaceAlt: "#1C1C1F",
  border: "#26262A",

  text: "#F5F5F4",
  textMuted: "#A1A1A6",
  textFaint: "#6B6B70",

  accent: "#E11D2E",
  accentPress: "#B31624",
  accentSoft: "rgba(225,29,46,0.12)",

  success: "#34D07F",
  warn: "#F5A524",
  neutral: "#7A7A80",

  overlay: "rgba(0,0,0,0.72)",
};

export const font = {
  body: "Barlow_400Regular",
  bodyMedium: "Barlow_500Medium",
  condensed: "BarlowCondensed_600SemiBold",
  condensedBold: "BarlowCondensed_700Bold",
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const type = {
  display: {
    fontFamily: font.condensedBold,
    fontSize: 32,
    color: colors.text,
    letterSpacing: 0.3,
  } as TextStyle,
  h1: {
    fontFamily: font.condensedBold,
    fontSize: 24,
    color: colors.text,
    letterSpacing: 0.3,
  } as TextStyle,
  h2: {
    fontFamily: font.condensed,
    fontSize: 18,
    color: colors.text,
    letterSpacing: 0.2,
  } as TextStyle,
  numLarge: {
    fontFamily: font.condensedBold,
    fontSize: 40,
    color: colors.text,
    letterSpacing: 0.5,
  } as TextStyle,
  num: {
    fontFamily: font.condensed,
    fontSize: 15,
    color: colors.text,
  } as TextStyle,
  body: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.text,
  } as TextStyle,
  label: {
    fontFamily: font.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  } as TextStyle,
  caption: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.textMuted,
  } as TextStyle,
  button: {
    fontFamily: font.condensedBold,
    fontSize: 16,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as TextStyle,
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  modal: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
};

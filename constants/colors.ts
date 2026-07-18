// ============================================================================
// GhostReply 2.0 - Enterprise Color Palette
// Premium AI Communication Coach for Freelancers
// ============================================================================

import {
  BRAND_PRIMARY,
  BRAND_PRIMARY_LIGHT,
  BRAND_PRIMARY_DARK,
  NEUTRAL_WHITE,
  NEUTRAL_50,
  NEUTRAL_100,
  NEUTRAL_200,
  NEUTRAL_300,
  NEUTRAL_400,
  NEUTRAL_500,
  NEUTRAL_600,
  NEUTRAL_700,
  NEUTRAL_800,
  NEUTRAL_900,
  SUCCESS,
  SUCCESS_LIGHT,
  WARNING,
  WARNING_LIGHT,
  ERROR,
  ERROR_LIGHT,
  INFO,
  DARK_BG_PRIMARY,
  DARK_BG_SECONDARY,
  DARK_BG_TERTIARY,
  DARK_TEXT_PRIMARY,
  DARK_TEXT_SECONDARY,
  DARK_TEXT_MUTED,
  LIGHT_BG_PRIMARY,
  LIGHT_BG_SECONDARY,
  LIGHT_BG_TERTIARY,
  LIGHT_TEXT_PRIMARY,
  LIGHT_TEXT_SECONDARY,
  LIGHT_TEXT_MUTED,
} from "./designTokens";

export const Colors = {
  // Brand Colors
  accent: BRAND_PRIMARY,
  accentLight: BRAND_PRIMARY_LIGHT,
  accentDark: BRAND_PRIMARY_DARK,
  primary: BRAND_PRIMARY,

  // Neutral
  white: NEUTRAL_WHITE,
  neutral50: NEUTRAL_50,
  neutral100: NEUTRAL_100,
  neutral200: NEUTRAL_200,
  neutral300: NEUTRAL_300,
  neutral400: NEUTRAL_400,
  neutral500: NEUTRAL_500,
  neutral600: NEUTRAL_600,
  neutral700: NEUTRAL_700,
  neutral800: NEUTRAL_800,
  neutral900: NEUTRAL_900,

  // Semantic
  success: SUCCESS,
  successLight: SUCCESS_LIGHT,
  warning: WARNING,
  warningLight: WARNING_LIGHT,
  error: ERROR,
  errorLight: ERROR_LIGHT,
  info: INFO,

  // Dark Mode (Default)
  bgPrimary: DARK_BG_PRIMARY,
  bgSecondary: DARK_BG_SECONDARY,
  bgTertiary: DARK_BG_TERTIARY,
  bgCard: DARK_BG_SECONDARY,
  bgSurface: DARK_BG_TERTIARY,
  textPrimary: DARK_TEXT_PRIMARY,
  textSecondary: DARK_TEXT_SECONDARY,
  textMuted: DARK_TEXT_MUTED,
  border: DARK_BG_TERTIARY,

  // Light Mode Support
  lightBgPrimary: LIGHT_BG_PRIMARY,
  lightBgSecondary: LIGHT_BG_SECONDARY,
  lightBgTertiary: LIGHT_BG_TERTIARY,
  lightTextPrimary: LIGHT_TEXT_PRIMARY,
  lightTextSecondary: LIGHT_TEXT_SECONDARY,
  lightTextMuted: LIGHT_TEXT_MUTED,

  // Gradients
  gradientStart: DARK_BG_PRIMARY,
  gradientMid: DARK_BG_SECONDARY,
  gradientEnd: DARK_BG_TERTIARY,

  // Workflow Colors (Professional)
  workflows: {
    winClient: BRAND_PRIMARY,
    negotiate: "#8B5CF6",
    followUp: "#EC4899",
    requestPayment: WARNING,
    handleFeedback: SUCCESS,
    difficultConversation: ERROR,
  },
};

export default {
  light: {
    text: LIGHT_TEXT_PRIMARY,
    background: LIGHT_BG_PRIMARY,
    tint: BRAND_PRIMARY,
    tabIconDefault: LIGHT_TEXT_MUTED,
    tabIconSelected: BRAND_PRIMARY,
  },
  dark: {
    text: DARK_TEXT_PRIMARY,
    background: DARK_BG_PRIMARY,
    tint: BRAND_PRIMARY,
    tabIconDefault: DARK_TEXT_MUTED,
    tabIconSelected: BRAND_PRIMARY,
  },
};

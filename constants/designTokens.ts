/**
 * GhostReply 2.0 - Enterprise Design System
 * Premium AI Communication Coach for Freelancers
 */

import type { TextStyle } from "react-native";

// ============================================================================
// COLOR SYSTEM - Enterprise Soft Palette
// ============================================================================

// Primary Brand Colors
export const BRAND_PRIMARY = "#6366F1"; // Soft Indigo
export const BRAND_PRIMARY_LIGHT = "#818CF8";
export const BRAND_PRIMARY_DARK = "#4F46E5";

// Neutral Colors - Premium White Space
export const NEUTRAL_WHITE = "#FFFFFF";
export const NEUTRAL_50 = "#F9FAFB";
export const NEUTRAL_100 = "#F3F4F6";
export const NEUTRAL_200 = "#E5E7EB";
export const NEUTRAL_300 = "#D1D5DB";
export const NEUTRAL_400 = "#9CA3AF";
export const NEUTRAL_500 = "#6B7280";
export const NEUTRAL_600 = "#4B5563";
export const NEUTRAL_700 = "#374151";
export const NEUTRAL_800 = "#1F2937";
export const NEUTRAL_900 = "#111827";

// Semantic Colors
export const SUCCESS = "#10B981"; // Emerald
export const SUCCESS_LIGHT = "#6EE7B7";
export const WARNING = "#F59E0B"; // Amber
export const WARNING_LIGHT = "#FCD34D";
export const ERROR = "#EF4444"; // Red
export const ERROR_LIGHT = "#FCA5A5";
export const INFO = "#3B82F6"; // Blue

// Dark Mode Support
export const DARK_BG_PRIMARY = "#0F172A"; // Deep Navy
export const DARK_BG_SECONDARY = "#1E293B";
export const DARK_BG_TERTIARY = "#334155";
export const DARK_TEXT_PRIMARY = "#F8FAFC";
export const DARK_TEXT_SECONDARY = "#CBD5E1";
export const DARK_TEXT_MUTED = "#94A3B8";

// Light Mode Support
export const LIGHT_BG_PRIMARY = "#FFFFFF";
export const LIGHT_BG_SECONDARY = "#F8FAFC";
export const LIGHT_BG_TERTIARY = "#F1F5F9";
export const LIGHT_TEXT_PRIMARY = "#0F172A";
export const LIGHT_TEXT_SECONDARY = "#475569";
export const LIGHT_TEXT_MUTED = "#64748B";

export const Colors = {
  // Brand
  primary: BRAND_PRIMARY,
  primaryLight: BRAND_PRIMARY_LIGHT,
  primaryDark: BRAND_PRIMARY_DARK,

  // Neutral
  white: NEUTRAL_WHITE,
  neutral: {
    50: NEUTRAL_50,
    100: NEUTRAL_100,
    200: NEUTRAL_200,
    300: NEUTRAL_300,
    400: NEUTRAL_400,
    500: NEUTRAL_500,
    600: NEUTRAL_600,
    700: NEUTRAL_700,
    800: NEUTRAL_800,
    900: NEUTRAL_900,
  },

  // Semantic
  success: SUCCESS,
  successLight: SUCCESS_LIGHT,
  warning: WARNING,
  warningLight: WARNING_LIGHT,
  error: ERROR,
  errorLight: ERROR_LIGHT,
  info: INFO,

  // Dark Mode
  dark: {
    bgPrimary: DARK_BG_PRIMARY,
    bgSecondary: DARK_BG_SECONDARY,
    bgTertiary: DARK_BG_TERTIARY,
    textPrimary: DARK_TEXT_PRIMARY,
    textSecondary: DARK_TEXT_SECONDARY,
    textMuted: DARK_TEXT_MUTED,
  },

  // Light Mode
  light: {
    bgPrimary: LIGHT_BG_PRIMARY,
    bgSecondary: LIGHT_BG_SECONDARY,
    bgTertiary: LIGHT_BG_TERTIARY,
    textPrimary: LIGHT_TEXT_PRIMARY,
    textSecondary: LIGHT_TEXT_SECONDARY,
    textMuted: LIGHT_TEXT_MUTED,
  },

  // Workflow Purpose Colors
  workflows: {
    winClient: "#6366F1", // Primary
    negotiate: "#8B5CF6", // Purple
    followUp: "#EC4899", // Pink
    requestPayment: "#F59E0B", // Amber
    handleFeedback: "#10B981", // Emerald
    difficultConversation: "#EF4444", // Red
  },
};

// ============================================================================
// TYPOGRAPHY SYSTEM - Professional & Elegant
// ============================================================================

const textStyles = {
  // Font families
  fonts: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },

  // Font sizes - Responsive scale
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "5xl": 40,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },

  // Predefined text styles
  styles: {
    // Headings
    h1: {
      fontSize: 40,
      fontWeight: "700",
      lineHeight: 48,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 28,
      fontWeight: "600",
      lineHeight: 36,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 32,
      letterSpacing: 0,
    },

    // Body text
    body1: {
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
      letterSpacing: 0,
    },
    body2: {
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
      letterSpacing: 0,
    },
    body3: {
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 18,
      letterSpacing: 0,
    },

    // Captions
    caption1: {
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 20,
      letterSpacing: 0,
    },
    caption2: {
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      letterSpacing: 0,
    },

    // Labels & buttons
    button: {
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 24,
      letterSpacing: 0,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
      letterSpacing: 0,
    },

    // Overline
    overline: {
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
} satisfies Record<string, unknown>;

export const Typography = {
  ...textStyles,
  styles: textStyles.styles as Record<string, TextStyle>,
};

// ============================================================================
// SPACING SYSTEM - 8px Grid
// ============================================================================

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// ============================================================================
// BORDER RADIUS - Subtle Elegance
// ============================================================================

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

// ============================================================================
// SHADOWS - Premium Elevation
// ============================================================================

export const Shadows = {
  none: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  base: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },

  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 8,
  },
};

// ============================================================================
// ANIMATIONS & TRANSITIONS
// ============================================================================

export const Animations = {
  // Durations (milliseconds)
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    long: 500,
  },

  // Easing functions
  easing: {
    linear: "linear",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeInCubic: "cubic-bezier(0.32, 0, 0.67, 0)",
    easeOutCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
    easeInOutCubic: "cubic-bezier(0.65, 0, 0.35, 1)",
    easeInQuart: "cubic-bezier(0.5, 0, 0.75, 0)",
    easeOutQuart: "cubic-bezier(0.25, 1, 0.5, 1)",
    easeOutQuint: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
};

// ============================================================================
// COMPONENT SIZING
// ============================================================================

export const ComponentSizes = {
  button: {
    height: {
      xs: 32,
      sm: 36,
      base: 44,
      lg: 48,
      xl: 56,
    },
  },

  input: {
    height: {
      sm: 36,
      base: 44,
      lg: 48,
    },
  },

  card: {
    minHeight: {
      sm: 80,
      base: 120,
      lg: 160,
    },
  },

  icon: {
    size: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 32,
      xl: 48,
    },
  },
};

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

export const Breakpoints = {
  xs: 0,
  sm: 360,
  md: 480,
  lg: 768,
  xl: 1024,
  "2xl": 1280,
};

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const ZIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animations,
  ComponentSizes,
  Breakpoints,
  ZIndex,
};

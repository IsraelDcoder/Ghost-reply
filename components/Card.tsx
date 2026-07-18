import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/designTokens";

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pressable?: boolean;
  onPress?: () => void;
  elevated?: boolean;
  padding?: number;
  gap?: number;
  variant?: "default" | "elevated" | "outlined" | "insight";
}

export const Card = React.forwardRef<View, CardProps>(
  (
    {
      children,
      style,
      pressable = false,
      onPress,
      elevated = false,
      padding = Spacing[4],
      gap = Spacing[3],
      variant = "default",
    },
    ref
  ) => {
    const [scaleAnim] = React.useState(new Animated.Value(1));

    const handlePressIn = () => {
      if (pressable) {
        Animated.spring(scaleAnim, {
          toValue: 0.98,
          useNativeDriver: true,
        }).start();
      }
    };

    const handlePressOut = () => {
      if (pressable) {
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    };

    const variantStyle = getVariantStyle(variant);
    const shadowStyle = elevated ? Shadows.md : Shadows.sm;

    const content = (
      <Animated.View
        style={[
          pressable && { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View
          ref={ref}
          style={[
            {
              backgroundColor: variantStyle.backgroundColor,
              borderRadius: BorderRadius.lg,
              borderWidth: variantStyle.borderWidth,
              borderColor: variantStyle.borderColor,
              padding,
              gap,
              ...shadowStyle,
            },
            style,
          ]}
        >
          {children}
        </View>
      </Animated.View>
    );

    if (pressable) {
      return (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {content}
        </Pressable>
      );
    }

    return content;
  }
);

Card.displayName = "Card";

function getVariantStyle(variant: string) {
  const styles = {
    default: {
      backgroundColor: Colors.dark.bgSecondary,
      borderWidth: 0,
      borderColor: "transparent",
    },
    elevated: {
      backgroundColor: Colors.neutral[50],
      borderWidth: 0,
      borderColor: "transparent",
    },
    outlined: {
      backgroundColor: Colors.dark.bgPrimary,
      borderWidth: 1,
      borderColor: Colors.dark.bgTertiary,
    },
    insight: {
      backgroundColor: Colors.primary + "15", // 15% opacity
      borderWidth: 1,
      borderColor: Colors.primary + "30", // 30% opacity
    },
  };

  return styles[variant as keyof typeof styles] || styles.default;
}

import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { Colors, Spacing, BorderRadius, ComponentSizes, Animations, Typography } from "@/constants/designTokens";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "xs" | "sm" | "base" | "lg" | "xl";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      variant = "primary",
      size = "base",
      isLoading = false,
      isDisabled = false,
      onPress,
      children,
      style,
      textStyle,
      icon,
      iconPosition = "left",
      fullWidth = false,
    },
    ref
  ) => {
    const [scaleAnim] = React.useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: Animations.duration.shortest,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: Animations.duration.shorter,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    };

    const buttonHeight = ComponentSizes.button.height[size];
    const styles = getStyles(variant, size);

    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          fullWidth && { width: "100%" },
        ]}
      >
        <TouchableOpacity
          ref={ref}
          style={[
            styles.button,
            fullWidth && { width: "100%" },
            isDisabled && { opacity: 0.5 },
            style,
          ]}
          onPress={onPress}
          disabled={isDisabled || isLoading}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          {isLoading && (
            <ActivityIndicator
              color={variant === "primary" ? Colors.white : Colors.primary}
              size="small"
            />
          )}
          {!isLoading && icon && iconPosition === "left" && (
            <React.Fragment>{icon}</React.Fragment>
          )}
          <Text style={[styles.text, textStyle]}>
            {typeof children === "string" ? children : children}
          </Text>
          {!isLoading && icon && iconPosition === "right" && (
            <React.Fragment>{icon}</React.Fragment>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

Button.displayName = "Button";

function getStyles(variant: ButtonVariant, size: ButtonSize) {
  const height = ComponentSizes.button.height[size];
  const fontSize =
    size === "xs"
      ? Typography.sizes.xs
      : size === "sm"
        ? Typography.sizes.sm
        : size === "base"
          ? Typography.sizes.base
          : size === "lg"
            ? Typography.sizes.lg
            : Typography.sizes.xl;

  const paddingHorizontal =
    size === "xs"
      ? Spacing[2]
      : size === "sm"
        ? Spacing[3]
        : size === "base"
          ? Spacing[4]
          : size === "lg"
            ? Spacing[5]
            : Spacing[6];

  const baseStyle = {
    height,
    borderRadius: BorderRadius.md,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    flexDirection: "row" as const,
    paddingHorizontal,
    gap: Spacing[2],
  };

  const variantStyles = {
    primary: {
      button: {
        ...baseStyle,
        backgroundColor: Colors.primary,
      },
      text: {
        color: Colors.white,
        fontSize,
        fontWeight: "600" as const,
      },
    },
    secondary: {
      button: {
        ...baseStyle,
        backgroundColor: Colors.neutral[200],
      },
      text: {
        color: Colors.neutral[900],
        fontSize,
        fontWeight: "600" as const,
      },
    },
    outline: {
      button: {
        ...baseStyle,
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: Colors.neutral[300],
      },
      text: {
        color: Colors.neutral[800],
        fontSize,
        fontWeight: "600" as const,
      },
    },
    ghost: {
      button: {
        ...baseStyle,
        backgroundColor: "transparent",
      },
      text: {
        color: Colors.primary,
        fontSize,
        fontWeight: "600" as const,
      },
    },
  };

  return variantStyles[variant];
}

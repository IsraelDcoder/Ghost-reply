import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Animated,
} from "react-native";
import { Colors, Spacing, BorderRadius, Typography, Animations } from "@/constants/designTokens";

export interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  isDisabled?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      error,
      isDisabled,
      containerStyle,
      leftIcon,
      rightIcon,
      multiline = false,
      numberOfLines = 1,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [borderColorAnim] = useState(new Animated.Value(0));

    const handleFocus = () => {
      setIsFocused(true);
      Animated.timing(borderColorAnim, {
        toValue: 1,
        duration: Animations.duration.short,
        useNativeDriver: false,
      }).start();
    };

    const handleBlur = () => {
      setIsFocused(false);
      Animated.timing(borderColorAnim, {
        toValue: 0,
        duration: Animations.duration.short,
        useNativeDriver: false,
      }).start();
    };

    const borderColor = borderColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.dark.bgTertiary, Colors.primary],
    });

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            style={[
              Typography.styles.caption1,
              { color: Colors.dark.textPrimary, marginBottom: Spacing[2] },
            ]}
          >
            {label}
          </Text>
        )}

        <Animated.View
          style={[
            styles.inputWrapper,
            {
              borderColor: isFocused
                ? Colors.primary
                : error
                  ? Colors.error
                  : Colors.dark.bgTertiary,
            },
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: Colors.dark.textPrimary,
                paddingLeft: leftIcon ? Spacing[1] : Spacing[3],
                paddingRight: rightIcon ? Spacing[1] : Spacing[3],
                height: multiline ? undefined : 44,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={Colors.dark.textMuted}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!isDisabled}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? "top" : "center"}
            {...rest}
          />

          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </Animated.View>

        {error && (
          <Text
            style={[
              Typography.styles.caption2,
              {
                color: Colors.error,
                marginTop: Spacing[1],
              },
            ]}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.bgPrimary,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing[2],
    gap: Spacing[2],
  },

  input: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fonts.regular,
    paddingVertical: Spacing[2],
  },

  iconLeft: {
    justifyContent: "center",
    alignItems: "center",
  },

  iconRight: {
    justifyContent: "center",
    alignItems: "center",
  },
});

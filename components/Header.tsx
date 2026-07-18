import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, BorderRadius } from "@/constants/designTokens";

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
  backgroundColor?: string;
  style?: ViewStyle;
  centerTitle?: boolean;
  largeTitle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  rightIcon,
  onRightPress,
  backgroundColor,
  style,
  centerTitle = false,
  largeTitle = false,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  if (largeTitle) {
    return (
      <View
        style={[
          {
            paddingTop: insets.top + Spacing[4],
            paddingHorizontal: Spacing[4],
            paddingBottom: Spacing[6],
            backgroundColor: backgroundColor || Colors.dark.bgPrimary,
          },
          style,
        ]}
      >
        {title && (
          <Text
            style={[
              Typography.styles.h1,
              {
                color: Colors.dark.textPrimary,
                marginBottom: subtitle ? Spacing[2] : 0,
              },
            ]}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            style={[
              Typography.styles.body1,
              {
                color: Colors.dark.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          paddingTop: insets.top,
          paddingHorizontal: Spacing[4],
          paddingVertical: Spacing[4],
          backgroundColor: backgroundColor || Colors.dark.bgPrimary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: centerTitle ? "center" : "space-between",
          gap: Spacing[3],
        },
        style,
      ]}
    >
      {/* Left Section */}
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing[2] }}>
        {showBackButton && (
          <Pressable
            onPress={handleBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: BorderRadius.md,
              backgroundColor: Colors.dark.bgSecondary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={Colors.dark.textPrimary}
            />
          </Pressable>
        )}

        {!centerTitle && title && (
          <Text
            style={[
              Typography.styles.h4,
              {
                color: Colors.dark.textPrimary,
                flex: 1,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>

      {/* Center Section */}
      {centerTitle && title && (
        <Text
          style={[
            Typography.styles.h4,
            {
              color: Colors.dark.textPrimary,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}

      {/* Right Section */}
      {rightIcon && (
        <Pressable
          onPress={onRightPress}
          style={{
            width: 40,
            height: 40,
            borderRadius: BorderRadius.md,
            backgroundColor: Colors.dark.bgSecondary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {rightIcon}
        </Pressable>
      )}
    </View>
  );
};

Header.displayName = "Header";

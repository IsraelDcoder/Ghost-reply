import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
  Platform,
} from "react-native";
import { Card } from "./Card";
import { Colors, Spacing, Typography, BorderRadius, Animations, Shadows } from "@/constants/designTokens";

export type WorkflowType =
  | "winClient"
  | "negotiate"
  | "followUp"
  | "requestPayment"
  | "handleFeedback"
  | "difficultConversation"
  | "somethingElse";

export interface WorkflowCardProps {
  type: WorkflowType;
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export const WorkflowCard = React.forwardRef<View, WorkflowCardProps>(
  ({ type, title, description, icon, onPress, style }, ref) => {
    const [scaleAnim] = useState(new Animated.Value(1));
    const [elevationAnim] = useState(new Animated.Value(0));

    const handlePressIn = () => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.97,
          duration: Animations.duration.shorter,
          useNativeDriver: true,
        }),
        Animated.timing(elevationAnim, {
          toValue: 1,
          duration: Animations.duration.shorter,
          useNativeDriver: false,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: Animations.duration.shorter,
          useNativeDriver: true,
        }),
        Animated.timing(elevationAnim, {
          toValue: 0,
          duration: Animations.duration.shorter,
          useNativeDriver: false,
        }),
      ]).start();
    };

    const workflowColor = Colors.workflows[type as keyof typeof Colors.workflows] ?? Colors.primary;
    const shadowStyle = elevationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [Shadows.sm.elevation, Shadows.lg.elevation],
    });

    return (
      <Animated.View
        ref={ref}
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View
            style={[
              {
                backgroundColor: Colors.dark.bgSecondary,
                borderRadius: BorderRadius.lg,
                borderWidth: 1,
                borderColor: Colors.dark.bgTertiary,
                padding: Spacing[4],
                gap: Spacing[3],
                ...Shadows.md,
              },
            ]}
          >
            {/* Icon Container */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: BorderRadius.md,
                backgroundColor: workflowColor + "20", // 20% opacity
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {icon}
            </View>

            {/* Title */}
            <Text
              style={[
                Typography.styles.h4,
                {
                  color: Colors.dark.textPrimary,
                  marginBottom: Spacing[1],
                },
              ]}
            >
              {title}
            </Text>

            {/* Description */}
            <Text
              style={[
                Typography.styles.body2,
                {
                  color: Colors.dark.textSecondary,
                  lineHeight: 20,
                },
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>

            {/* Accent Line */}
            <View
              style={{
                height: 2,
                backgroundColor: workflowColor,
                marginTop: Spacing[2],
                borderRadius: BorderRadius.full,
              }}
            />
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

WorkflowCard.displayName = "WorkflowCard";

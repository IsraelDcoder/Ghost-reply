import React, { useEffect, useState } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, Animations } from "@/constants/designTokens";

export interface ThinkingStageProps {
  stage: number;
  totalStages?: number;
  currentMessage?: string;
}

const THINKING_STAGES = [
  {
    icon: "chat-processing",
    label: "Understanding your situation...",
  },
  {
    icon: "brain",
    label: "Analyzing client psychology...",
  },
  {
    icon: "strategy",
    label: "Planning communication strategy...",
  },
  {
    icon: "pencil-box-outline",
    label: "Crafting professional response...",
  },
  {
    icon: "lightbulb-on",
    label: "Preparing communication insight...",
  },
];

export const ThinkingStages: React.FC<ThinkingStageProps> = ({
  stage,
  totalStages = THINKING_STAGES.length,
  currentMessage,
}) => {
  const [dotAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnimation, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(dotAnimation, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [dotAnimation]);

  const opacity = dotAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const currentStage = THINKING_STAGES[stage] || THINKING_STAGES[0];

  return (
    <View style={styles.container}>
      {/* Stages Progress */}
      <View style={styles.stagesContainer}>
        {Array.from({ length: totalStages }).map((_, index) => (
          <View key={index} style={styles.stageWrapper}>
            <View
              style={[
                styles.stageDot,
                {
                  backgroundColor:
                    index < stage
                      ? Colors.primary
                      : index === stage
                        ? Colors.primary + "60"
                        : Colors.dark.bgTertiary,
                  borderColor:
                    index <= stage ? Colors.primary : Colors.dark.bgTertiary,
                },
              ]}
            >
              {index < stage && (
                <MaterialCommunityIcons
                  name="check"
                  size={12}
                  color={Colors.white}
                />
              )}
              {index === stage && (
                <Animated.View style={{ opacity }}>
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: Colors.primary,
                    }}
                  />
                </Animated.View>
              )}
            </View>

            {index < totalStages - 1 && (
              <View
                style={[
                  styles.stageLine,
                  {
                    backgroundColor:
                      index < stage
                        ? Colors.primary
                        : Colors.dark.bgTertiary,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Current Stage Message */}
      <View style={styles.messageContainer}>
        <MaterialCommunityIcons
          name={currentStage.icon as any}
          size={32}
          color={Colors.primary}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={[
              Typography.styles.body1,
              {
                color: Colors.dark.textPrimary,
                fontWeight: "600",
              },
            ]}
          >
            {currentMessage || currentStage.label}
          </Text>

          <Animated.View style={{ opacity }}>
            <Text
              style={[
                Typography.styles.caption1,
                {
                  color: Colors.dark.textMuted,
                  marginTop: Spacing[1],
                },
              ]}
            >
              Processing...
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

ThinkingStages.displayName = "ThinkingStages";

const styles = StyleSheet.create({
  container: {
    gap: Spacing[6],
    paddingVertical: Spacing[4],
  },

  stagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stageWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  stageDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  stageLine: {
    height: 2,
    flex: 1,
    marginHorizontal: Spacing[1],
  },

  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[4],
    backgroundColor: Colors.primary + "10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "./Card";
import { Colors, Spacing, Typography, BorderRadius } from "@/constants/designTokens";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface InsightCardProps {
  title?: string;
  insight: string;
  icon?: React.ReactNode;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title = "Communication Insight",
  insight,
  icon,
}) => {
  return (
    <Card variant="insight" padding={Spacing[4]} gap={Spacing[3]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[2] }}>
        {icon || (
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={24}
            color={Colors.primary}
          />
        )}
        <Text
          style={[
            Typography.styles.caption1,
            {
              color: Colors.primary,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            },
          ]}
        >
          {title}
        </Text>
      </View>

      {/* Content */}
      <Text
        style={[
          Typography.styles.body1,
          {
            color: Colors.dark.textPrimary,
            lineHeight: 24,
            fontWeight: "500",
          },
        ]}
      >
        {insight}
      </Text>
    </Card>
  );
};

InsightCard.displayName = "InsightCard";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";

import { Header } from "@/components/Header";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "@/constants/designTokens";

interface SettingSection {
  title: string;
  icon: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: "toggle" | "action" | "select";
  value?: boolean;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleToggle = (id: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (id) {
      case "notifications":
        setNotificationsEnabled(value);
        break;
      case "darkMode":
        setDarkMode(value);
        break;
      case "analytics":
        setAnalyticsEnabled(value);
        break;
    }
  };

  const handleAction = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (id) {
      case "feedback":
        Alert.alert("Feedback", "Thank you for your feedback!");
        break;
      case "support":
        Alert.alert("Support", "support@ghostreply.app");
        break;
      case "terms":
        Alert.alert("Terms", "https://ghostreply.app/terms");
        break;
      case "privacy":
        Alert.alert("Privacy", "https://ghostreply.app/privacy");
        break;
    }
  };

  const sections: SettingSection[] = [
    {
      title: "Appearance",
      icon: "palette",
      items: [
        {
          id: "darkMode",
          label: "Dark Mode",
          description: "Use dark theme throughout the app",
          type: "toggle",
          value: darkMode,
        },
      ],
    },
    {
      title: "Notifications",
      icon: "bell",
      items: [
        {
          id: "notifications",
          label: "Push Notifications",
          description: "Get notified about replies and events",
          type: "toggle",
          value: notificationsEnabled,
        },
      ],
    },
    {
      title: "Privacy & Data",
      icon: "shield-lock",
      items: [
        {
          id: "analytics",
          label: "Analytics",
          description: "Help us improve by sharing usage data",
          type: "toggle",
          value: analyticsEnabled,
        },
      ],
    },
    {
      title: "Support",
      icon: "headset",
      items: [
        {
          id: "feedback",
          label: "Send Feedback",
          description: "Share your thoughts and suggestions",
          type: "action",
          onPress: () => handleAction("feedback"),
        },
        {
          id: "support",
          label: "Contact Support",
          description: "Get help with your account",
          type: "action",
          onPress: () => handleAction("support"),
        },
      ],
    },
    {
      title: "Legal",
      icon: "file-document",
      items: [
        {
          id: "terms",
          label: "Terms of Service",
          type: "action",
          onPress: () => handleAction("terms"),
        },
        {
          id: "privacy",
          label: "Privacy Policy",
          type: "action",
          onPress: () => handleAction("privacy"),
        },
      ],
    },
  ];

  return (
    <Container scrollable edges={false}>
      <Header showBackButton title="Settings" />

      <View style={{ padding: Spacing[4] }}>
        {sections.map((section) => (
          <View key={section.title} style={{ marginBottom: Spacing[6] }}>
            {/* Section Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing[2],
                marginBottom: Spacing[3],
              }}
            >
              <MaterialCommunityIcons
                name={section.icon as any}
                size={20}
                color={Colors.primary}
              />
              <Text
                style={[
                  Typography.styles.overline,
                  {
                    color: Colors.dark.textMuted,
                  },
                ]}
              >
                {section.title}
              </Text>
            </View>

            {/* Section Items */}
            <View style={{ gap: Spacing[2] }}>
              {section.items.map((item, index) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  padding={Spacing[4]}
                  gap={0}
                  pressable={item.type === "action"}
                  onPress={
                    item.type === "action" ? item.onPress : undefined
                  }
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          Typography.styles.body1,
                          {
                            color: Colors.dark.textPrimary,
                            fontWeight: "500",
                            marginBottom: item.description
                              ? Spacing[1]
                              : 0,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text
                          style={[
                            Typography.styles.caption2,
                            {
                              color: Colors.dark.textSecondary,
                            },
                          ]}
                        >
                          {item.description}
                        </Text>
                      )}
                    </View>

                    {item.type === "toggle" && (
                      <Switch
                        value={item.value || false}
                        onValueChange={(value) =>
                          handleToggle(item.id, value)
                        }
                        trackColor={{
                          false: Colors.dark.bgTertiary,
                          true: Colors.primary + "40",
                        }}
                        thumbColor={
                          item.value ? Colors.primary : Colors.dark.bgTertiary
                        }
                        style={{ marginLeft: Spacing[3] }}
                      />
                    )}

                    {item.type === "action" && (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={Colors.dark.textMuted}
                        style={{ marginLeft: Spacing[3] }}
                      />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View
          style={{
            paddingVertical: Spacing[4],
            borderTopWidth: 1,
            borderTopColor: Colors.dark.bgTertiary,
            marginTop: Spacing[4],
          }}
        >
          <Text
            style={[
              Typography.styles.caption2,
              {
                color: Colors.dark.textMuted,
                textAlign: "center",
              },
            ]}
          >
            GhostReply 2.0
          </Text>
          <Text
            style={[
              Typography.styles.caption2,
              {
                color: Colors.dark.textMuted,
                textAlign: "center",
                marginTop: Spacing[1],
              },
            ]}
          >
            Version {Constants.expoConfig?.version || "1.0.0"}
          </Text>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({});

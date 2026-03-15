/**
 * Allow Notifications Onboarding Screen
 *
 * Requests notification permissions from user
 * Explains benefits of notifications for the app
 * Routes to paywall after user decision
 */

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  SafeAreaView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function AllowNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [isRequesting, setIsRequesting] = React.useState(false);

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideUpAnim]);

  const handleRequestNotifications = async () => {
    setIsRequesting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Dynamically import Notifications only when needed
      // This avoids errors in Expo Go
      const Notifications = await import("expo-notifications").then(
        (m) => m.default
      );

      const permission = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      // Permission requested (whether granted or denied)
      // Continue to paywall regardless
      setTimeout(() => {
        router.push("/paywall");
      }, 500);
    } catch (error) {
      // Notifications not available (e.g., in Expo Go)
      // Just continue to paywall
      console.log("Notifications unavailable, continuing to paywall");
      setTimeout(() => {
        router.push("/paywall");
      }, 500);
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/paywall");
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBox}>
            <Ionicons
              name="notifications-circle"
              size={80}
              color="#7C3AED"
              style={styles.icon}
            />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.textContainer}>
          <Text style={styles.headline}>Stay Updated</Text>

          <Text style={styles.subtitle}>
            Get notified when your replies are ready to use
          </Text>

          {/* Benefits List */}
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#7C3AED"
                style={styles.benefitIcon}
              />
              <Text style={styles.benefitText}>
                Instant reply notifications
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#7C3AED"
                style={styles.benefitIcon}
              />
              <Text style={styles.benefitText}>Never miss an update</Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#7C3AED"
                style={styles.benefitIcon}
              />
              <Text style={styles.benefitText}>
                Quick access to AI suggestions
              </Text>
            </View>
          </View>
        </View>

        {/* Button Section */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.allowButton,
              pressed && styles.allowButtonPressed,
              isRequesting && styles.allowButtonDisabled,
            ]}
            onPress={handleRequestNotifications}
            disabled={isRequesting}
          >
            <Text style={styles.allowButtonText}>
              {isRequesting ? "Requesting..." : "Allow Notifications"}
            </Text>
          </Pressable>

          <Pressable style={styles.skipButtonContainer} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Later</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B1A",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "space-between",
  },

  /* Icon Styles */
  iconContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  icon: {
    textAlign: "center",
  },

  /* Text Styles */
  textContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
  },

  /* Benefits List */
  benefitsList: {
    width: "100%",
    marginTop: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(124, 58, 237, 0.05)",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },

  /* Button Styles */
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  allowButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }
      : {
          elevation: 8,
        }),
  },
  allowButtonPressed: {
    backgroundColor: "#6D28D9",
    opacity: 0.9,
  },
  allowButtonDisabled: {
    opacity: 0.6,
  },
  allowButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  skipButtonContainer: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  skipButtonText: {
    color: "#A0A0A0",
    fontSize: 16,
    fontWeight: "600",
  },
});

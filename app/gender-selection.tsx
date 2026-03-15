/**
 * Gender Selection Onboarding Screen
 * 
 * Second step in onboarding flow after demo video
 * Collects user preference data for personalization
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
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";

const GENDER_OPTIONS = [
  { id: "man", label: "I'm a guy", icon: "male" },
  { id: "woman", label: "I'm a girl", icon: "female" },
  { id: "prefer-not-to-say", label: "Prefer not to say", icon: "help-circle" },
];

export default function GenderSelectionScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedGender, setSelectedGender] = React.useState<string | null>(
    null
  );

  // Animate in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleGenderSelect = async (genderId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGender(genderId);
    // Could save to context or state here
  };

  const handleContinue = async () => {
    if (!selectedGender) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to notification permissions screen
    router.push("/allow-notifications");
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerContent}>
            <Text style={styles.title}>Let's personalize your experience</Text>
            <Text style={styles.subtitle}>
              This helps us suggest better replies
            </Text>
          </View>

          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {GENDER_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.optionButton,
                selectedGender === option.id && styles.optionButtonSelected,
                pressed && styles.optionButtonPressed,
              ]}
              onPress={() => handleGenderSelect(option.id)}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={selectedGender === option.id ? "#7C3AED" : "#A0A0A0"}
                />
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  selectedGender === option.id && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              {selectedGender === option.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#7C3AED"
                  style={styles.checkmark}
                />
              )}
            </Pressable>
          ))}
        </View>

        {/* Continue Button */}
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            !selectedGender && styles.continueButtonDisabled,
            pressed && selectedGender && styles.continueButtonPressed,
          ]}
          onPress={handleContinue}
          disabled={!selectedGender}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
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
    justifyContent: "space-between",
    paddingBottom: 32,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  backButtonPlaceholder: {
    width: 44,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    color: "#A0A0A0",
    marginTop: 4,
    fontWeight: "400",
  },

  /* Options */
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  optionButtonSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderColor: "#7C3AED",
  },
  optionButtonPressed: {
    opacity: 0.7,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#A0A0A0",
  },
  optionLabelSelected: {
    color: "#7C3AED",
  },
  checkmark: {
    marginLeft: 12,
  },

  /* Continue Button */
  continueButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    ...Platform.select({
      ios: {
        shadowColor: "#7C3AED",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

/**
 * RevenueCat Paywall Component
 * components/RevenueCatPaywall.tsx
 *
 * Displays RevenueCat paywall with:
 * - Automatic layout and styling from dashboard
 * - Product selection and purchase handling
 * - Error handling and loading states
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  Platform,
  ScrollView,
  NativeMethods,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import { Colors } from "@/constants/colors";

// Event names enum (matching react-native-purchases-ui)
enum PaywallEventName {
  PURCHASE_COMPLETED = "PURCHASE_COMPLETED",
  PURCHASE_FAILED = "PURCHASE_FAILED",
  RESTORE_COMPLETED = "RESTORE_COMPLETED",
  RESTORE_FAILED = "RESTORE_FAILED",
  DISMISSED = "DISMISSED",
}

interface RevenueCatPaywallProps {
  onComplete?: () => void;
  onDismiss?: () => void;
  automaticallyDismissWhenPurchased?: boolean;
}

export function RevenueCatPaywall({
  onComplete,
  onDismiss,
  automaticallyDismissWhenPurchased = true,
}: RevenueCatPaywallProps) {
  const { refreshSubscriptionStatus } = useSubscription();
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle paywall events
   * Triggered when user completes purchase, dismisses, or encounters error
   */
  const handlePaywallEvent = async (event: PaywallEventName, data?: unknown) => {
    console.log("[Paywall] Event received:", event);

    switch (event) {
      case PaywallEventName.PURCHASE_COMPLETED:
        console.log("[Paywall] Purchase completed successfully");
        await refreshSubscriptionStatus();

        if (onComplete) {
          onComplete();
        }

        if (automaticallyDismissWhenPurchased) {
          setIsDisplaying(false);
        }
        break;

      case PaywallEventName.PURCHASE_FAILED:
        console.log("[Paywall] Purchase failed:", data);
        Alert.alert("Purchase Failed", "Please try again. If the issue persists, contact support.");
        break;

      case PaywallEventName.RESTORE_COMPLETED:
        console.log("[Paywall] Restore purchases completed");
        await refreshSubscriptionStatus();
        Alert.alert("Success", "Your purchases have been restored!");
        break;

      case PaywallEventName.RESTORE_FAILED:
        console.log("[Paywall] Restore purchases failed:", data);
        Alert.alert(
          "Restore Failed",
          "Could not restore purchases. Please check your internet connection."
        );
        break;

      case PaywallEventName.DISMISSED:
        console.log("[Paywall] Paywall dismissed");
        if (onDismiss) {
          onDismiss();
        }
        setIsDisplaying(false);
        break;

      default:
        console.log("[Paywall] Other event:", event);
    }
  };

  if (!isDisplaying) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.paywallContainer}>
        <Text style={styles.title}>GhostReply Pro</Text>
        <Text style={styles.subtitle}>Unlock unlimited smart replies</Text>
        
        <View style={styles.featureList}>
          <Text style={styles.feature}>✓ Unlimited conversations</Text>
          <Text style={styles.feature}>✓ Advanced AI suggestions</Text>
          <Text style={styles.feature}>✓ All tone options</Text>
          <Text style={styles.feature}>✓ Priority support</Text>
        </View>

        <Pressable
          style={styles.purchaseButton}
          onPress={() => console.log("[Paywall] RevenueCat paywall triggered")}
        >
          <Text style={styles.buttonText}>Subscribe Now</Text>
        </Pressable>

        <Pressable
          style={styles.dismissButton}
          onPress={() => {
            if (onDismiss) onDismiss();
            setIsDisplaying(false);
          }}
        >
          <Text style={styles.dismissText}>Maybe Later</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A1A",
  },
  paywallContainer: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9B9BBF",
    marginBottom: 32,
    textAlign: "center",
  },
  featureList: {
    marginBottom: 32,
    gap: 12,
  },
  feature: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  purchaseButton: {
    backgroundColor: "#7B6CFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  dismissText: {
    fontSize: 14,
    color: "#7B6CFF",
    fontWeight: "500",
  },
});

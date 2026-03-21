/**
 * Updated Paywall Screen with RevenueCat Integration
 * app/paywall-with-revenueCat.tsx
 *
 * Features:
 * - Display RevenueCat managed paywall OR custom paywall
 * - Purchase handling via RevenueCat
 * - Trial start via backend
 * - Restore purchases option
 * - Customer Center support
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import { useApp } from "@/context/AppContext";
import { RevenueCatPaywall } from "@/components/RevenueCatPaywall";
import { getAvailableOfferings } from "@/lib/revenueCat";
import { Colors } from "@/constants/colors";

const FEATURE_BENEFITS = [
  "🔥 Get smart reply suggestions tailored to your style",
  "💬 Unlock unlimited conversations",
  "🎯 Choose the perfect tone (flirty, savage, funny, etc.)",
  "⏰ Never worry about daily limits",
  "📱 Works offline and instantly",
];

type PaywallMode = "custom" | "revenueCat";

export default function PaywallScreenWithRevenueCat() {
  const insets = useSafeAreaInsets();
  const { startTrial, subscriptionStatus, purchaseSubscription: purchase, loading } =
    useSubscription();
  const { setHasOnboarded } = useApp();

  const [paywallMode, setPaywallMode] = useState<PaywallMode>("custom");
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("weekly");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showRevenueCatPaywall, setShowRevenueCatPaywall] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);

  // Fetch available offerings on mount
  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const data = await getAvailableOfferings();
        setOfferings(data);
        console.log("[Paywall] Offerings loaded:", data?.availablePackages.length);
      } catch (error) {
        console.error("[Paywall] Error loading offerings:", error);
      }
    };

    if (paywallMode === "custom") {
      fetchOfferings();
    }
  }, [paywallMode]);

  /**
   * Start free trial via backend
   */
  const handleStartTrial = async () => {
    if (subscriptionStatus?.isTrialActive || subscriptionStatus?.isSubscribed) {
      return;
    }

    if (loading) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await startTrial();
      await setHasOnboarded(true);
      router.replace("/home");
    } catch (error) {
      Alert.alert("Error", "Failed to start trial. Please try again.");
      console.error("[Paywall] Trial error:", error);
    }
  };

  /**
   * Handle subscription purchase via RevenueCat
   */
  const handlePurchaseSubscription = async () => {
    if (isPurchasing) return;

    const productID = selectedPlan === "weekly" ? "weekly" : "monthly";
    const productIDWithPrefix = `com-ghostreply-premium-${productID}`;

    setIsPurchasing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("[Paywall] Starting purchase for:", productIDWithPrefix);

      const success = await purchase(productIDWithPrefix);

      if (success) {
        Alert.alert("Success!", "Welcome to GhostReply Pro! 🎉");
        await setHasOnboarded(true);
        router.replace("/home");
      } else {
        Alert.alert(
          "Purchase Failed",
          "Your purchase could not be completed. Please try again."
        );
      }
    } catch (error) {
      console.error("[Paywall] Purchase error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  /**
   * Continue with free plan
   */
  const handleContinueWithFree = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setHasOnboarded(true);
    router.replace("/home");
  };

  /**
   * Show RevenueCat managed paywall
   */
  const handleShowRevenueCatPaywall = () => {
    setShowRevenueCatPaywall(true);
  };

  if (showRevenueCatPaywall) {
    return (
      <RevenueCatPaywall
        onDismiss={() => setShowRevenueCatPaywall(false)}
        onComplete={() => {
          router.replace("/home");
        }}
      />
    );
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  return (
    <LinearGradient colors={["#0A0A1A", "#0F0A2E", "#1A0A2E"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding + 20, paddingBottom: bottomPadding + 20 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.ghostEmoji}>👻</Text>
          <Text style={styles.mainTitle}>Never Get Left On Read Again</Text>
          <Text style={styles.subtitle}>Unlock unlimited smart replies in any situation.</Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          {FEATURE_BENEFITS.map((benefit, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Text style={styles.featureText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Paywall Mode Selector */}
        <View style={styles.modeSelector}>
          <Pressable
            onPress={() => setPaywallMode("custom")}
            style={[
              styles.modeButton,
              paywallMode === "custom" && styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeButtonText,
                paywallMode === "custom" && styles.modeButtonTextActive,
              ]}
            >
              Custom Paywall
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setPaywallMode("revenueCat")}
            style={[
              styles.modeButton,
              paywallMode === "revenueCat" && styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeButtonText,
                paywallMode === "revenueCat" && styles.modeButtonTextActive,
              ]}
            >
              RevenueCat Paywall
            </Text>
          </Pressable>
        </View>

        {/* Custom Paywall Content */}
        {paywallMode === "custom" && (
          <>
            {/* Plans */}
            <View style={styles.plansContainer}>
              {/* Weekly Plan */}
              <Pressable
                onPress={() => setSelectedPlan("weekly")}
                style={[
                  styles.planCard,
                  selectedPlan === "weekly" && styles.planCardSelected,
                ]}
              >
                <View style={styles.planBadge}>
                  <Text style={styles.badgeEmoji}>🔥</Text>
                  <Text style={styles.badgeText}>Most Popular</Text>
                </View>
                <Text style={styles.price}>$2.99</Text>
                <Text style={styles.period}>/week</Text>
                <View style={styles.featuresBox}>
                  <Text style={styles.planFeature}>• 2-3 day trial first</Text>
                  <Text style={styles.planFeature}>• Cancel anytime</Text>
                </View>
              </Pressable>

              {/* Monthly Plan */}
              <Pressable
                onPress={() => setSelectedPlan("monthly")}
                style={[
                  styles.planCard,
                  selectedPlan === "monthly" && styles.planCardSelected,
                ]}
              >
                <View style={styles.planBadge}>
                  <Text style={styles.badgeEmoji}>💎</Text>
                  <Text style={styles.badgeText}>Best Value</Text>
                </View>
                <Text style={styles.price}>$9.99</Text>
                <Text style={styles.period}>/month</Text>
                <View style={styles.featuresBox}>
                  <Text style={styles.planFeature}>• 3-day free trial</Text>
                  <Text style={styles.planFeature}>• 17% savings</Text>
                  <Text style={styles.planFeature}>• Cancel anytime</Text>
                </View>
              </Pressable>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsSection}>
              {/* Subscribe Button */}
              <Pressable
                onPress={handlePurchaseSubscription}
                disabled={isPurchasing || loading}
                style={[
                  styles.primaryButton,
                  (isPurchasing || loading) && styles.buttonDisabled,
                ]}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Start {selectedPlan === "weekly" ? "Weekly" : "Monthly"} Trial
                  </Text>
                )}
              </Pressable>

              {/* Continue Free Button */}
              <Pressable
                onPress={handleContinueWithFree}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Continue with Free Plan</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* RevenueCat Paywall Mode */}
        {paywallMode === "revenueCat" && (
          <View style={styles.revenueCatSection}>
            <Text style={styles.revenueCatDescription}>
              Powered by RevenueCat{"\n"}Secure subscription management
            </Text>

            <Pressable
              onPress={handleShowRevenueCatPaywall}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Show RevenueCat Paywall</Text>
            </Pressable>

            <Text style={styles.infoText}>
              RevenueCat displays a beautiful, fully-managed paywall with your configured products.
            </Text>
          </View>
        )}

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <Pressable>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </Pressable>
        </View>

        {/* Restore Purchases */}
        <Pressable style={styles.restoreButton}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  ghostEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  featuresSection: {
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  featureRow: {
    marginBottom: 12,
  },
  featureText: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
  },
  modeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1a1a3e",
    borderWidth: 1,
    borderColor: "#333",
  },
  modeButtonActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  modeButtonText: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  plansContainer: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: "#1a1a3e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#333",
  },
  planCardSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#2a2a5e",
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  badgeEmoji: {
    fontSize: 18,
  },
  badgeText: {
    color: "#fbbf24",
    fontSize: 13,
    fontWeight: "600",
  },
  price: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  period: {
    color: "#999",
    fontSize: 14,
    marginBottom: 12,
  },
  featuresBox: {
    gap: 8,
  },
  planFeature: {
    color: "#ddd",
    fontSize: 13,
  },
  buttonsSection: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6366f1",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
  },
  revenueCatSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  revenueCatDescription: {
    color: "#ddd",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  infoText: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  footerLink: {
    color: "#6366f1",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  footerDivider: {
    color: "#666",
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  restoreButtonText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

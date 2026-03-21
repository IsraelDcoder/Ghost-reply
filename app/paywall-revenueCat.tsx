/**
 * Paywall Screen with RevenueCat Integration - CUSTOM UI ONLY
 * app/paywall-revenueCat.tsx
 *
 * Features:
 * - Display ONLY custom paywall UI (NO Google Play UI)
 * - Fetch real prices from RevenueCat offerings
 * - Purchase handling via RevenueCat (system dialog for Google Play)
 * - Error handling with retry button
 * - Trial start via backend
 * - Restore purchases option
 * - Loading and error states
 */

import React, { useState, useEffect, useCallback } from "react";
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
import { getAvailableOfferings } from "@/lib/revenueCat";
import { Colors } from "@/constants/colors";

const FEATURE_BENEFITS = [
  "🔥 Get smart reply suggestions tailored to your style",
  "💬 Unlock unlimited conversations",
  "🎯 Choose the perfect tone (flirty, savage, funny, etc.)",
  "⏰ Never worry about daily limits",
  "📱 Works offline and instantly",
];

interface PlanData {
  id: string;
  type: "weekly" | "monthly";
  priceString: string;
  period: string;
  badge: {
    emoji: string;
    text: string;
  };
  features: string[];
}

export default function PaywallScreenWithRevenueCat() {
  const insets = useSafeAreaInsets();
  const { startTrial, subscriptionStatus, purchaseSubscription: purchase, loading, restorePurchases } =
    useSubscription();
  const { setHasOnboarded } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("weekly");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Map<string, PlanData>>(new Map());

  /**
   * Fetch available offerings from RevenueCat
   * Extract real prices and display data
   */
  const fetchOfferings = useCallback(async () => {
    try {
      setIsLoadingOfferings(true);
      setOfferingsError(null);
      console.log("[Paywall] Fetching offerings from RevenueCat...");

      const offerings = await getAvailableOfferings();

      if (!offerings || !offerings.availablePackages || offerings.availablePackages.length === 0) {
        throw new Error("No offerings available from RevenueCat");
      }

      const plansMap = new Map<string, PlanData>();

      // Find and parse weekly and monthly packages
      for (const pkg of offerings.availablePackages) {
        const isWeekly = pkg.identifier.includes("weekly");
        const isMonthly = pkg.identifier.includes("monthly");

        if (isWeekly) {
          plansMap.set("weekly", {
            id: pkg.identifier,
            type: "weekly",
            priceString: pkg.product?.priceString || "$2.99",
            period: "/week",
            badge: { emoji: "🔥", text: "Most Popular" },
            features: [
              "• 2-3 day trial first",
              "• Cancel anytime",
            ],
          });
        } else if (isMonthly) {
          plansMap.set("monthly", {
            id: pkg.identifier,
            type: "monthly",
            priceString: pkg.product?.priceString || "$9.99",
            period: "/month",
            badge: { emoji: "💎", text: "Best Value" },
            features: [
              "• 3-day free trial",
              "• 17% savings",
              "• Cancel anytime",
            ],
          });
        }
      }

      setPlans(plansMap);
      console.log("[Paywall] Offerings loaded successfully:", {
        weekly: plansMap.get("weekly")?.priceString,
        monthly: plansMap.get("monthly")?.priceString,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load offerings";
      console.error("[Paywall] Error loading offerings:", errorMessage);
      setOfferingsError(errorMessage);
    } finally {
      setIsLoadingOfferings(false);
    }
  }, []);

  // Fetch offerings on mount
  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

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
   * This triggers the SYSTEM purchase dialog (Google Play)
   * NOT a custom Google Play UI - only the system confirmation
   */
  const handlePurchaseSubscription = async () => {
    if (isPurchasing) return;

    const selectedPlanData = plans.get(selectedPlan);
    if (!selectedPlanData) {
      Alert.alert("Error", "Plan not found. Please try again.");
      return;
    }

    const packageID = selectedPlanData.id;

    setIsPurchasing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("[Paywall] Starting purchase for:", packageID);

      const success = await purchase(packageID);

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
   * Restore previous purchases
   */
  const handleRestorePurchases = async () => {
    try {
      console.log("[Paywall] Initiating restore purchases...");
      await restorePurchases();
      // Alert is handled by the context
    } catch (error) {
      console.error("[Paywall] Restore error:", error);
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  // Render loading state
  if (isLoadingOfferings) {
    return (
      <LinearGradient colors={["#0A0A1A", "#0F0A2E", "#1A0A2E"]} style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Render error state with retry button
  if (offeringsError) {
    return (
      <LinearGradient colors={["#0A0A1A", "#0F0A2E", "#1A0A2E"]} style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color="#ff6b6b"
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{offeringsError}</Text>
          <Pressable
            onPress={fetchOfferings}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>

          {/* Fallback to free plan option */}
          <Pressable
            onPress={handleContinueWithFree}
            style={styles.skipsButton}
          >
            <Text style={styles.skipButtonText}>Continue with Free Plan</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

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

        {/* Plans - From RevenueCat Offerings */}
        <View style={styles.plansContainer}>
          {/* Weekly Plan */}
          {plans.get("weekly") && (
            <Pressable
              onPress={() => setSelectedPlan("weekly")}
              style={[
                styles.planCard,
                selectedPlan === "weekly" && styles.planCardSelected,
              ]}
            >
              <View style={styles.planBadge}>
                <Text style={styles.badgeEmoji}>{plans.get("weekly")?.badge.emoji}</Text>
                <Text style={styles.badgeText}>{plans.get("weekly")?.badge.text}</Text>
              </View>
              <Text style={styles.price}>{plans.get("weekly")?.priceString}</Text>
              <Text style={styles.period}>{plans.get("weekly")?.period}</Text>
              <View style={styles.featuresBox}>
                {plans.get("weekly")?.features.map((feature, idx) => (
                  <Text key={idx} style={styles.planFeature}>
                    {feature}
                  </Text>
                ))}
              </View>
            </Pressable>
          )}

          {/* Monthly Plan */}
          {plans.get("monthly") && (
            <Pressable
              onPress={() => setSelectedPlan("monthly")}
              style={[
                styles.planCard,
                selectedPlan === "monthly" && styles.planCardSelected,
              ]}
            >
              <View style={styles.planBadge}>
                <Text style={styles.badgeEmoji}>{plans.get("monthly")?.badge.emoji}</Text>
                <Text style={styles.badgeText}>{plans.get("monthly")?.badge.text}</Text>
              </View>
              <Text style={styles.price}>{plans.get("monthly")?.priceString}</Text>
              <Text style={styles.period}>{plans.get("monthly")?.period}</Text>
              <View style={styles.featuresBox}>
                {plans.get("monthly")?.features.map((feature, idx) => (
                  <Text key={idx} style={styles.planFeature}>
                    {feature}
                  </Text>
                ))}
              </View>
            </Pressable>
          )}
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
        <Pressable onPress={handleRestorePurchases} style={styles.restoreButton}>
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
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    color: "#ddd",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  errorTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    color: "#999",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  skipsButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  skipButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    textDecorationLine: "underline",
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

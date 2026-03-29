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
  Linking,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import { useApp } from "@/context/AppContext";
import { getAvailableOfferings } from "@/lib/revenueCat";
import { Colors } from "@/constants/colors";

// Social proof & trust elements
const SOCIAL_PROOF = {
  userCount: "early",
  rating: "5.0",
  testimonial: "GhostReply got me 7 dates in one week.",
  testimonialAuthor: "Chidi, Lagos",
};

const FEATURE_BENEFITS = [
  "✨ Match Your Vibe",
  "✨ The Ultimate Edge",
  "✨ Proven to Get Replies & Dates",
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
  const { startTrial, subscriptionStatus, purchaseSubscription: purchase, loading, restorePurchases, shouldBypassPaywall, refreshSubscriptionStatus } =
    useSubscription();
  const { setHasOnboarded } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("monthly"); // Default to best value
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Map<string, PlanData>>(new Map());

  // Check if user should bypass paywall (already has subscription)
  useEffect(() => {
    if (shouldBypassPaywall()) {
      console.log("[Paywall] User already has active subscription, redirecting to home");
      router.replace("/home");
    }
  }, [shouldBypassPaywall]);

  // 🔥 CRITICAL: Refresh subscription status every time paywall screen comes into focus
  // This catches purchases that just completed and redirects to home
  useFocusEffect(
    useCallback(() => {
      console.log("[Paywall] Screen focused - checking if user already has subscription...");
      refreshSubscriptionStatus();
    }, [refreshSubscriptionStatus])
  );

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

      console.log('[Paywall] Offerings response:', offerings);

      if (!offerings || !offerings.availablePackages || offerings.availablePackages.length === 0) {
        throw new Error("No offerings available from RevenueCat. Have you configured offerings in RevenueCat dashboard?");
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
    if (isPurchasing) {
      console.log("[Paywall] Purchase already in progress, ignoring tap");
      return;
    }

    const selectedPlanData = plans.get(selectedPlan);
    if (!selectedPlanData) {
      console.error("[Paywall] Plan not found:", selectedPlan);
      Alert.alert("Error", "Plan not found. Please try again.");
      return;
    }

    const packageID = selectedPlanData.id;
    console.log("[Paywall] User tapped purchase button for:", packageID);

    setIsPurchasing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log("[Paywall] Starting purchase for:", packageID);

      const success = await purchase(packageID);

      if (success) {
        console.log("[Paywall] ✓ Purchase completed successfully!");
        await refreshSubscriptionStatus();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success! 🎉", "Welcome to GhostReply Pro!");
        // setHasOnboarded is async and persists to storage - MUST await it
        await setHasOnboarded(true);
        
        // Small delay to ensure navigation happens
        setTimeout(() => {
          console.log("[Paywall] Navigating to home after purchase");
          router.replace("/home");
        }, 500);
      } else {
        // Purchase failed or was cancelled - don't show alert for cancellations
        console.log("[Paywall] Purchase did not complete (likely user cancelled)");
      }
    } catch (error) {
      console.error("[Paywall] Purchase error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Purchase Error", `Something went wrong: ${errorMsg}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  /**
   * Continue with free plan
   * Does NOT call RevenueCat - just navigates to home as free-tier user
   * This is a simple navigation, no subscription logic needed
   */
  const handleContinueWithFree = async () => {
    try {
      console.log("[Paywall] User tapped free plan button");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      console.log("[Paywall] Marking onboarded and navigating to home...");
      // setHasOnboarded is async and persists to storage - MUST await it
      await setHasOnboarded(true);
      
      // Small delay to ensure AsyncStorage persists and state updates complete
      setTimeout(() => {
        console.log("[Paywall] ✓ State persisted, now navigating to /home");
        router.replace("/home");
      }, 500);
    } catch (error) {
      console.error("[Paywall] Error in free plan flow:", error);
      console.error("[Paywall] Error details:", JSON.stringify(error));
      Alert.alert("Error", `Could not continue. Error: ${error}`);
    }
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
    const isNetworkError = offeringsError.toLowerCase().includes('network') || 
                          offeringsError.toLowerCase().includes('connection');
    const isConfigError = offeringsError.toLowerCase().includes('no offerings') ||
                         offeringsError.toLowerCase().includes('offerings');
    
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
          <Text style={styles.errorMessage}>
            {isConfigError 
              ? "Subscriptions are being set up. Check back soon!"
              : isNetworkError
              ? "No internet connection. Please check your network."
              : offeringsError}
          </Text>
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
          <Text style={styles.mainTitle}>INFINITE.{"\n"}REPLIES.</Text>
        </View>

        {/* Social Proof Section */}
        <View style={styles.socialProofSection}>

          <Text style={styles.testimonialText}>\"{SOCIAL_PROOF.testimonial}\" — {SOCIAL_PROOF.testimonialAuthor}</Text>
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
              <Text style={styles.planName}>GhostReply Pro Weekly</Text>
              <View style={styles.planBadge}>
                <Text style={styles.badgeEmoji}>{plans.get("weekly")?.badge.emoji}</Text>
                <Text style={styles.badgeText}>{plans.get("weekly")?.badge.text}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plans.get("weekly")?.priceString}</Text>
                <Text style={styles.period}>{plans.get("weekly")?.period}</Text>
              </View>
              <Text style={styles.trialText}>2-3 day free trial</Text>
              <View style={styles.featuresBox}>
                {plans.get("weekly")?.features.map((feature, idx) => (
                  <Text key={idx} style={styles.planFeature}>
                    {feature}
                  </Text>
                ))}
              </View>
            </Pressable>
          )}

          {/* Monthly Plan - Premium Option */}
          {plans.get("monthly") && (
            <View>
              <Pressable
                onPress={() => setSelectedPlan("monthly")}
                style={[
                  styles.planCard,
                  selectedPlan === "monthly" && styles.planCardSelected,
                  selectedPlan === "monthly" && styles.planCardPremium,
                ]}
              >
                {selectedPlan === "monthly" && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
                <Text style={styles.planName}>GhostReply Pro Monthly</Text>
                <View style={styles.planBadgeContainer}>
                  <View style={styles.planBadge}>
                    <Text style={styles.badgeEmoji}>{plans.get("monthly")?.badge.emoji}</Text>
                    <Text style={[styles.badgeText, styles.bestValueBadge]}>{plans.get("monthly")?.badge.text}</Text>
                  </View>
                  <Text style={styles.savingsTag}>Save 67%</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{plans.get("monthly")?.priceString}</Text>
                  <Text style={styles.period}>{plans.get("monthly")?.period}</Text>
                </View>
                <Text style={styles.trialText}>3-day free trial</Text>
                <View style={styles.featuresBox}>
                  {plans.get("monthly")?.features.map((feature, idx) => (
                    <Text key={idx} style={styles.planFeature}>
                      {feature}
                    </Text>
                  ))}
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsSection}>
          {/* Subscribe Button - High Converting CTA */}
          <Pressable
            onPress={handlePurchaseSubscription}
            disabled={isPurchasing}
            style={[
              styles.primaryButton,
              isPurchasing && styles.buttonDisabled,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.ctaContent}>
                <Text style={styles.primaryButtonText}>🔒 Unlock Selected Plan</Text>
              </View>
            )}
          </Pressable>

          {/* Continue Free Button */}
          <Pressable
            onPress={handleContinueWithFree}
            style={styles.secondaryButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.secondaryButtonText}>Continue with Free Plan</Text>
          </Pressable>
        </View>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <Pressable 
            onPress={() => Linking.openURL("mailto:theonyekachithompson@gmail.com")}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Text style={styles.footerLink}>Email</Text>
          </Pressable>
          <Text style={styles.footerDivider}>·</Text>
          <Pressable 
            onPress={() => Linking.openURL("https://ghostreply-app.netlify.app/")}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Text style={styles.footerLink}>Terms</Text>
          </Pressable>
          <Text style={styles.footerDivider}>·</Text>
          <Pressable onPress={handleRestorePurchases} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
            <Text style={styles.footerLink}>Restore</Text>
          </Pressable>
        </View>
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
    lineHeight: 22,
  },
  subtitleHighlight: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fbbf24",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 28,
  },
  socialProofSection: {
    marginBottom: 32,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#1a1a3e",
    borderRadius: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  stars: {
    fontSize: 16,
    color: "#fbbf24",
    letterSpacing: 2,
  },
  ratingText: {
    color: "#fbbf24",
    fontSize: 16,
    fontWeight: "700",
  },
  testimonialText: {
    color: "#ccc",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  featuresSection: {
    marginBottom: 32,
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featuresTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  featureRow: {
    flex: 1,
    minWidth: "45%",
    marginBottom: 0,
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
    position: "relative",
  },
  planName: {
    color: "#c4b5fd",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  checkmarkContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#6366f1",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  planCardSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#2a2a5e",
  },
  planCardPremium: {
    borderColor: "#fbbf24",
    backgroundColor: "#3a3a1a",
  },
  planBadgeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bestValueBadge: {
    color: "#fbbf24",
  },
  savingsTag: {
    backgroundColor: "#fbbf24",
    color: "#000",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceContainer: {
    marginBottom: 8,
  },
  trialText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
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
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  ctaIcon: {
    fontSize: 24,
    marginRight: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  riskReversalText: {
    color: "#ccc",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
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
    marginBottom: 12,
  },
  footerLink: {
    color: "#6366f1",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  footerDivider: {
    color: "#666",
  },
  footerText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
  trustBadges: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  trustBadge: {
    alignItems: "center",
    gap: 4,
  },
  trustIcon: {
    fontSize: 20,
  },
  trustText: {
    color: "#999",
    fontSize: 11,
    textAlign: "center",
  },
  restoreButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  restoreButtonText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

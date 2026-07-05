/**
 * Paywall Screen with RevenueCat Integration - CLEAN
 * Consolidated premium UI layout and purchase flow.
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

const SOCIAL_PROOF = {
  testimonial: "GhostReply got me 7 dates in one week.",
  testimonialAuthor: "Chidi, Lagos",
};

const FEATURE_CARDS = [
  { icon: "⚡", title: "Unlimited AI Replies", subtitle: "Never run out of things to say." },
  { icon: "✨", title: "Multiple Reply Styles", subtitle: "Flirty, Funny, Confident & more." },
  { icon: "🛡", title: "Private & Secure", subtitle: "Your chats remain private." },
  { icon: "⏱", title: "Reply in Seconds", subtitle: "No more overthinking." },
];

interface PlanData {
  id: string;
  type: "weekly" | "monthly";
  priceString: string;
  period: string;
}

export default function PaywallScreenWithRevenueCat() {
  const insets = useSafeAreaInsets();
  const { subscriptionStatus, purchaseSubscription: purchase, loading, restorePurchases, shouldBypassPaywall, refreshSubscriptionStatus } = useSubscription();
  const { setHasOnboarded } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("monthly");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Map<string, PlanData>>(new Map());

  useEffect(() => {
    if (shouldBypassPaywall()) {
      router.replace("/home");
    }
  }, [shouldBypassPaywall]);

  useFocusEffect(
    useCallback(() => {
      refreshSubscriptionStatus();
    }, [refreshSubscriptionStatus])
  );

  const fetchOfferings = useCallback(async () => {
    try {
      setIsLoadingOfferings(true);
      setOfferingsError(null);
      const offerings = await getAvailableOfferings();

      if (!offerings || !offerings.availablePackages || offerings.availablePackages.length === 0) {
        throw new Error("No offerings available from RevenueCat");
      }

      const plansMap = new Map<string, PlanData>();
      for (const pkg of offerings.availablePackages) {
        const isWeekly = pkg.identifier.includes("weekly");
        const isMonthly = pkg.identifier.includes("monthly");

        if (isWeekly) {
          plansMap.set("weekly", {
            id: pkg.identifier,
            type: "weekly",
            priceString: pkg.product?.priceString ?? "$2.99",
            period: "/week",
          });
        } else if (isMonthly) {
          plansMap.set("monthly", {
            id: pkg.identifier,
            type: "monthly",
            priceString: pkg.product?.priceString ?? "$9.99",
            period: "/month",
          });
        }
      }

      setPlans(plansMap);
    } catch (err) {
      setOfferingsError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingOfferings(false);
    }
  }, []);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  const handlePurchaseSubscription = async () => {
    if (isPurchasing) return;
    const plan = plans.get(selectedPlan);
    if (!plan) {
      Alert.alert("Error", "Please select a plan.");
      return;
    }

    setIsPurchasing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const success = await purchase(plan.id);
      if (success) {
        await refreshSubscriptionStatus();
        await setHasOnboarded(true);
        router.replace("/home");
      }
    } catch (err) {
      Alert.alert("Purchase Error", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleContinueForFree = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setHasOnboarded(true);
    router.replace("/home");
  };

  const handleRestorePurchases = async () => {
    try {
      await restorePurchases();
    } catch (err) {
      Alert.alert("Restore Error", "Failed to restore purchases.");
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  if (isLoadingOfferings) {
    return (
      <LinearGradient colors={["#05050D", "#070A1A", "#0D1130"]} style={styles.container}>
        <View style={[styles.centerContent, { paddingTop: topPadding + 20 }]}> 
          <ActivityIndicator size="large" color="#8B76FF" />
          <Text style={styles.loadingText}>Loading premium plans...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (offeringsError) {
    return (
      <LinearGradient colors={["#05050D", "#070A1A", "#0D1130"]} style={styles.container}>
        <View style={[styles.centerContent, { paddingTop: topPadding + 20 }]}> 
          <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{offeringsError}</Text>
          <Pressable onPress={fetchOfferings} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const monthly = plans.get("monthly");
  const weekly = plans.get("weekly");

  return (
    <LinearGradient colors={["#05050D", "#070A1A", "#0D1130"]} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 24 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleContinueForFree} style={styles.closeButton}>
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
          <View style={styles.brandingRow}>
            <Text style={styles.brandLogo}>👻</Text>
            <Text style={styles.brandText}>GhostReply</Text>
          </View>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroHeadline}>Reply Smarter.{"\n"}Sound Like You.</Text>
          <Text style={styles.heroSubtitle}>AI replies that actually sound human, so every text feels effortless.</Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewDot} />
            <View style={styles.previewDot} />
            <View style={styles.previewDot} />
          </View>
          <View style={styles.previewThread}>
            <View style={styles.previewPersonRow}>
              <Text style={styles.previewAvatar}>👩</Text>
              <Text style={styles.previewPerson}>Emily</Text>
            </View>
            <View style={styles.previewBubble}>
              <Text style={styles.previewBubbleLabel}>Hey, are you free tonight? 🤔</Text>
            </View>
            <View style={styles.previewDivider} />
            <Text style={styles.previewGhostLabel}>GhostReply</Text>
            <View style={styles.replyOption}>
              <Text style={styles.replyOptionBadge}>💜 Flirty</Text>
              <Text style={styles.replyOptionText}>Only if you're asking me on a date 😉</Text>
            </View>
            <View style={styles.replyOption}>
              <Text style={styles.replyOptionBadge}>💚 Funny</Text>
              <Text style={styles.replyOptionText}>Free tonight... dangerous combo 😎</Text>
            </View>
            <View style={styles.replyOption}>
              <Text style={styles.replyOptionBadge}>💙 Confident</Text>
              <Text style={styles.replyOptionText}>Yes. But I decide where we go.</Text>
            </View>
          </View>

          <View style={styles.beforeAfterRow}>
            <View style={styles.beforeAfterBox}>
              <Text style={styles.beforeAfterLabel}>Before</Text>
              <Text style={styles.beforeAfterText}>“ok”</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#A179FF" />
            <View style={[styles.beforeAfterBox, styles.afterBox]}>
              <Text style={styles.beforeAfterLabel}>After</Text>
              <Text style={styles.beforeAfterText}>“Sounds good! Looking forward to it 😊”</Text>
            </View>
          </View>
        </View>

        <View style={styles.benefitsBlock}>
          <Text style={styles.benefitItem}>✓ Reply instantly</Text>
          <Text style={styles.benefitItem}>✓ Sound more confident, funny, or flirty</Text>
          <Text style={styles.benefitItem}>✓ Never overthink texts again</Text>
        </View>

        <View style={styles.planContainer}>
          <Text style={styles.sectionTitle}>Choose your plan</Text>
          <View style={styles.planCardsRow}>
            {monthly ? (
              <Pressable onPress={() => setSelectedPlan("monthly")} style={[styles.planCard, styles.planCardPopular, selectedPlan === "monthly" && styles.planCardSelected]}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
                <Text style={styles.planTitle}>Monthly</Text>
                <Text style={styles.planPrice}>{monthly.priceString}</Text>
                <Text style={styles.planPeriod}>Best value • cancel anytime</Text>
              </Pressable>
            ) : null}

            {weekly ? (
              <Pressable onPress={() => setSelectedPlan("weekly")} style={[styles.planCard, styles.planCardSimple, selectedPlan === "weekly" && styles.planCardSelected]}>
                <Text style={styles.planTitle}>Weekly</Text>
                <Text style={styles.planPrice}>{weekly.priceString}</Text>
                <Text style={styles.planPeriod}>Flexible</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.trustRow}>
          <Text style={styles.stars}>★★★★★</Text>
          <Text style={styles.trustText}>Loved by people who text every day.</Text>
        </View>

        <Pressable onPress={handlePurchaseSubscription} disabled={isPurchasing} style={styles.primaryButton}>
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Unlock Unlimited Replies</Text>
              <Text style={styles.primaryButtonSubtext}>{selectedPlan === "monthly" ? `${monthly?.priceString ?? ""}/month` : `${weekly?.priceString ?? ""}/week`}</Text>
              <Text style={styles.primaryButtonHint}>Cancel anytime</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={handleContinueForFree} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Explore the App</Text>
          <Text style={styles.secondaryButtonSmall}>See how Ghost Reply works</Text>
        </Pressable>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Secure payment via Google Play • Cancel anytime</Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={handleRestorePurchases}><Text style={styles.footerLink}>Restore Purchase</Text></Pressable>
            <Text style={styles.footerDivider}>•</Text>
            <Pressable onPress={() => Linking.openURL("https://ghostreply-app.netlify.app/")}><Text style={styles.footerLink}>Terms</Text></Pressable>
            <Text style={styles.footerDivider}>•</Text>
            <Pressable onPress={() => Linking.openURL("https://ghostreply-app.netlify.app/")}><Text style={styles.footerLink}>Privacy Policy</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  loadingText: { color: "#ddd", fontSize: 16, marginTop: 16, textAlign: "center" },
  errorTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  errorMessage: { color: "#999", fontSize: 14, marginBottom: 24, textAlign: "center", lineHeight: 20 },
  retryButton: { backgroundColor: "#6366f1", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginTop: 12 },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  brandingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 1 },
  topSpacer: { width: 44 },
  brandLogo: { fontSize: 22, marginRight: 8 },
  brandText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  heroSection: { marginBottom: 28 },
  heroHeadline: { color: "#fff", fontSize: 34, fontWeight: "900", lineHeight: 42, marginBottom: 10 },
  heroHeadlineHighlight: { color: "#A179FF" },
  heroSubtitle: { color: "#C2C1D9", fontSize: 15, lineHeight: 22 },
  previewCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 16, marginBottom: 18 },
  previewHeader: { flexDirection: "row", gap: 8, marginBottom: 10 },
  previewDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.24)" },
  previewThread: { backgroundColor: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 16 },
  previewPersonRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  previewAvatar: { fontSize: 18, marginRight: 8 },
  previewPerson: { color: "#fff", fontSize: 14, fontWeight: "700" },
  previewBubble: { backgroundColor: "rgba(255,255,255,0.08)", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 10 },
  previewBubbleLabel: { color: "#fff", fontSize: 14 },
  previewDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginVertical: 10 },
  previewGhostLabel: { color: "#A179FF", fontSize: 14, fontWeight: "800", marginBottom: 8 },
  replyOption: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", marginBottom: 8 },
  replyOptionBadge: { color: "#fff", fontSize: 12, fontWeight: "800", marginBottom: 4 },
  replyOptionText: { color: "#CFCFE8", fontSize: 13 },
  beforeAfterRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  beforeAfterBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 10, borderRadius: 10 },
  afterBox: { backgroundColor: "rgba(161,121,255,0.12)" },
  beforeAfterLabel: { color: "#8F8FB7", fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 },
  beforeAfterText: { color: "#fff", fontSize: 12 },
  benefitsBlock: { marginBottom: 18, paddingHorizontal: 4 },
  benefitItem: { color: "#D6D4EB", fontSize: 14, marginBottom: 8 },
  planContainer: { marginBottom: 16 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  planCardsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  planCard: { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  planCardPopular: { paddingVertical: 18, borderColor: "#A179FF", backgroundColor: "rgba(161,121,255,0.12)" },
  planCardSimple: { paddingVertical: 12 },
  planCardSelected: { borderColor: "#8B76FF", shadowColor: "#8B76FF", shadowOpacity: 0.14, shadowRadius: 10, borderWidth: 1.5 },
  popularBadge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  popularBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  planTitle: { color: "#fff", fontSize: 14, fontWeight: "800", marginBottom: 6 },
  planPrice: { color: "#fff", fontSize: 20, fontWeight: "800" },
  planPeriod: { color: "#B8B7D6", fontSize: 12, marginTop: 4 },
  trustRow: { alignItems: "center", marginBottom: 12 },
  stars: { color: "#FFD66B", fontSize: 16, marginBottom: 4, letterSpacing: 2 },
  trustText: { color: "#D6D4EB", fontSize: 13, textAlign: "center" },
  primaryButton: { marginTop: 12, borderRadius: 14, backgroundColor: "#8B76FF", paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  primaryButtonSubtext: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 4 },
  primaryButtonHint: { color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 4 },
  secondaryButton: { marginTop: 10, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  secondaryButtonText: { color: "#B1A7FF", fontSize: 15, fontWeight: "800" },
  secondaryButtonSmall: { color: "#8F8FB7", fontSize: 12, marginTop: 6 },
  footerSection: { alignItems: "center", marginTop: 20, marginBottom: 20 },
  footerText: { color: "#77798F", fontSize: 12, marginBottom: 10 },
  footerLinks: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerLink: { color: "#8F8FB7", fontSize: 12, textDecorationLine: "underline" },
  footerDivider: { color: "#666", marginHorizontal: 6 },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSubscription } from "@/context/SubscriptionContext";
import { Colors } from "@/constants/colors";

const TIRED_OF_LIST = [
  "Getting left on read?",
  "Not knowing what to say?",
  "Reply with confidence in any situation",
  "Choose the perfect vibe (flirty, savage, funny, etc.)",
  "Never overthink texts again",
];

const PLANS = [
  {
    id: "weekly",
    name: "Most Popular",
    price: "$2.99",
    period: "/week",
    badge: "🔥",
    features: ["2-3 day trial first", "Cancel anytime"],
  },
  {
    id: "monthly",
    name: "Best Value",
    price: "$9.99",
    period: "/month",
    badge: "💎",
    features: ["3-day free trial first", "Cancel anytime", "17% savings"],
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { startTrial, subscriptionStatus } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("weekly");

  const handleStartTrial = async () => {
    if (subscriptionStatus?.isTrialActive || subscriptionStatus?.isSubscribed) {
      return;
    }

    if (loading) return;

    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await startTrial();
      router.replace("/home");
    } catch (error) {
      console.error("Trial start error:", error);
    } finally {
      setLoading(false);
    }
  };

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
        {/* Ghost Icon */}
        <View style={styles.ghostContainer}>
          <Text style={styles.ghostEmoji}>👻</Text>
        </View>

        {/* Main Title */}
        <Text style={styles.mainTitle}>Never Get Left On Read Again</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Your messages deserve better replies.</Text>

        {/* Example Reply */}
        <View style={styles.exampleBox}>
          <Text style={styles.exampleLabel}>Example reply:</Text>
          <Text style={styles.exampleText}>Careful... you might actually start liking me 😏</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>GhostReply fixes that instantly.</Text>

        {/* Price Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id as "weekly" | "monthly")}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
            >
              {/* Badge */}
              <View style={styles.planBadge}>
                <Text style={styles.badgeEmoji}>{plan.badge}</Text>
                <Text style={styles.badgeText}>{plan.name}</Text>
              </View>

              {/* Price */}
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>{plan.period}</Text>

              {/* Features */}
              {plan.features.map((feature, idx) => (
                <Text key={idx} style={styles.feature}>
                  • {feature}
                </Text>
              ))}
            </Pressable>
          ))}
        </View>

        {/* Tired Of Section */}
        <View style={styles.tiredOfContainer}>
          <Text style={styles.tiredOfTitle}>✅ Tired of:</Text>

          {TIRED_OF_LIST.map((item, idx) => (
            <View key={idx} style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#7B6CFF" />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={handleStartTrial}
          disabled={
            loading || subscriptionStatus?.isTrialActive || subscriptionStatus?.isSubscribed
          }
          style={({ pressed }) => [
            styles.ctaButton,
            {
              opacity:
                pressed || loading || subscriptionStatus?.isTrialActive || subscriptionStatus?.isSubscribed
                  ? 0.6
                  : 1,
            },
          ]}
        >
          <LinearGradient
            colors={["#7B6CFF", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {loading
                ? "Starting..."
                : subscriptionStatus?.isTrialActive || subscriptionStatus?.isSubscribed
                  ? "✓ Active"
                  : "Start Winning Now"}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Social Proof */}
        <Text style={styles.socialProof}>Join 10,000+ users improving their conversations.</Text>

        {/* Footer Links */}
        <View style={styles.footer}>
          <Pressable>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.footerDot}>•</Text>
          <Pressable>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.footerDot}>•</Text>
          <Pressable>
            <Text style={styles.footerLink}>Restore Purchases</Text>
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
    paddingHorizontal: 24,
    gap: 16,
  },
  ghostContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  ghostEmoji: {
    fontSize: 60,
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    textAlign: "center",
    marginBottom: 16,
  },
  exampleBox: {
    backgroundColor: "#1A1A35",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#7B6CFF",
  },
  exampleLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#7B6CFF",
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  plansContainer: {
    gap: 12,
    marginVertical: 12,
  },
  planCard: {
    backgroundColor: "#1A1A35",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#252545",
  },
  planCardSelected: {
    borderColor: "#7B6CFF",
    backgroundColor: "#1A1A35",
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#7B6CFF",
  },
  price: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  period: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A5A7A",
    marginBottom: 12,
  },
  feature: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    marginTop: 4,
  },
  tiredOfContainer: {
    backgroundColor: "#1A1A35",
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
  },
  tiredOfTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  checkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    flex: 1,
  },
  ctaButton: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  socialProof: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    textAlign: "center",
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A5A7A",
  },
  footerDot: {
    fontSize: 12,
    color: "#5A5A7A",
  },
});


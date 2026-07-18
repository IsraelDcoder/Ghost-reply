import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import {
  Colors,
  Spacing,
  BorderRadius,
} from "@/constants/designTokens";

interface PlanFeature {
  text: string;
  icon: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  popular: boolean;
  features: PlanFeature[];
  cta: string;
}

const PLANS: PricingPlan[] = [
  {
    id: "yearly",
    name: "Yearly",
    price: "$39.99",
    period: "per year",
    popular: true,
    features: [
      { icon: "chat-multiple-outline", text: "Unlimited Conversations" },
      { icon: "strategy", text: "AI Strategy Coaching" },
      { icon: "lightbulb-on", text: "Communication Insights" },
      { icon: "clock-fast", text: "Priority Processing" },
      { icon: "database-export", text: "Conversation History" },
      { icon: "refresh-circle", text: "Reply Regeneration" },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "$7.99",
    period: "per month",
    popular: false,
    features: [
      { icon: "chat-multiple-outline", text: "Unlimited Conversations" },
      { icon: "strategy", text: "AI Strategy Coaching" },
      { icon: "lightbulb-on", text: "Communication Insights" },
    ],
    cta: "Start Free Trial",
  },
];

const BENEFIT_BULLETS = [
  "Communicate Better",
  "Win More Clients",
  "Negotiate Professionally",
  "Handle Difficult Conversations",
  "Request Payments Confidently",
  "Become a Better Freelancer",
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { requirePremiumAccess } = useSubscription();
  const { setHasOnboarded } = useApp();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinueLimited = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setHasOnboarded(true);
    router.replace("/home");
  };

  const handleStartTrial = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    try {
      if (requirePremiumAccess()) {
        router.replace("/home");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to start trial");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container scrollable edges={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Unlock Your Full Communication Power</Text>
          <Text style={styles.subtitle}>
            Join professionals who earn more, lose less sleep, and build stronger client relationships.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          {BENEFIT_BULLETS.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={styles.benefitCheckmark}>
                <MaterialCommunityIcons name="check" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <Text style={styles.plansLabel}>Choose Your Plan</Text>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => {
                setSelectedPlan(plan.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Card
                variant={selectedPlan === plan.id ? "default" : "outlined"}
                padding={Spacing[4]}
                gap={Spacing[3]}
              >
                {/* Plan Header */}
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                  {selectedPlan === plan.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedText}>Selected</Text>
                    </View>
                  )}
                </View>

                {/* Price */}
                <View>
                  <Text style={styles.price}>
                    {plan.price}
                    <Text style={styles.priceSubtext}> / year</Text>
                  </Text>
                  {plan.popular && (
                    <Text style={styles.popularBadge}>Most Popular - Save 40%</Text>
                  )}
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <MaterialCommunityIcons
                        name={feature.icon as any}
                        size={18}
                        color={Colors.primary}
                      />
                      <Text style={styles.featureText}>{feature.text}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[4] }]}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isProcessing}
          isDisabled={isProcessing}
          onPress={handleStartTrial}
        >
          Start 7-Day Free Trial
        </Button>

        <Text style={styles.disclaimer}>
          Cancel anytime. No credit card required.
        </Text>

        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onPress={handleContinueLimited}
        >
          Continue with Limited Access
        </Button>

        {/* Legal */}
        <View style={styles.legalContainer}>
          <Pressable>
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
          <Text style={styles.legalDot}>•</Text>
          <Pressable>
            <Text style={styles.legalLink}>Privacy</Text>
          </Pressable>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[6],
    gap: Spacing[6],
  } as const,
  headerContent: {
    gap: Spacing[3],
  } as const,
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    letterSpacing: -0.5,
    color: Colors.dark.textPrimary,
  } as any,
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    color: Colors.dark.textSecondary,
  } as any,
  benefitsContainer: {
    gap: Spacing[2],
  } as const,
  benefitItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing[3],
  } as const,
  benefitCheckmark: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  } as const,
  benefitText: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.dark.textPrimary,
  } as any,
  plansLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase" as any,
    color: Colors.dark.textMuted,
  } as any,
  plansContainer: {
    gap: Spacing[3],
  } as const,
  planHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  } as const,
  planName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
  } as any,
  planPeriod: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
    marginTop: Spacing[1],
  } as any,
  selectedBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + "20",
  } as const,
  selectedText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
  } as any,
  price: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    color: Colors.dark.textPrimary,
  } as any,
  priceSubtext: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.dark.textSecondary,
  } as any,
  popularBadge: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.success,
    marginTop: Spacing[1],
  } as any,
  featuresContainer: {
    gap: Spacing[2],
  } as const,
  featureItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing[2],
  } as const,
  featureText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.dark.textPrimary,
  } as any,
  footer: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  } as const,
  disclaimer: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.dark.textMuted,
    textAlign: "center" as any,
    marginBottom: Spacing[2],
  } as any,
  legalContainer: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: Spacing[2],
    marginTop: Spacing[2],
  } as const,
  legalLink: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.dark.textMuted,
  } as any,
  legalDot: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  } as any,
});

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
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";

const FEATURES = [
  { icon: "camera", text: "AI analyzes chat screenshots" },
  { icon: "chatbubbles", text: "Generate perfect replies instantly" },
  { icon: "color-palette", text: "5 unique conversation tones" },
  { icon: "infinite", text: "Unlimited conversations" },
  { icon: "trending-up", text: "Conversation score & insights" },
  { icon: "share-social", text: "Shareable chat screenshots" },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { setIsSubscribed } = useApp();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");

  const handleStartTrial = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 1000));
      await setIsSubscribed(true);
      router.replace("/home");
    } catch {
      Alert.alert("Error", "Failed to start trial. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFree = async () => {
    await Haptics.selectionAsync();
    router.replace("/home");
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
        <View style={styles.header}>
          <LinearGradient
            colors={["#7B6CFF", "#A855F7"]}
            style={styles.iconContainer}
          >
            <Text style={styles.iconEmoji}>👻</Text>
          </LinearGradient>
          <Text style={styles.title}>Unlock GhostReply Pro</Text>
          <Text style={styles.subtitle}>
            Start your 3-day free trial. Cancel anytime.
          </Text>
        </View>

        <View style={styles.plansRow}>
          <Pressable
            onPress={() => setSelectedPlan("monthly")}
            style={[
              styles.planCard,
              selectedPlan === "monthly" && styles.planCardSelected,
            ]}
          >
            {selectedPlan === "monthly" && (
              <LinearGradient
                colors={["#7B6CFF20", "#A855F710"]}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text style={styles.planLabel}>Monthly</Text>
            <Text style={styles.planPrice}>$7.99</Text>
            <Text style={styles.planPer}>/month</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedPlan("yearly")}
            style={[
              styles.planCard,
              selectedPlan === "yearly" && styles.planCardSelected,
            ]}
          >
            {selectedPlan === "yearly" && (
              <LinearGradient
                colors={["#7B6CFF20", "#A855F710"]}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 59%</Text>
            </View>
            <Text style={styles.planLabel}>Yearly</Text>
            <Text style={styles.planPrice}>$39</Text>
            <Text style={styles.planPer}>/year</Text>
          </Pressable>
        </View>

        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={f.icon as any} size={18} color="#7B6CFF" />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleStartTrial}
          disabled={loading}
          style={({ pressed }) => [styles.ctaButton, { opacity: pressed || loading ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["#7B6CFF", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {loading ? "Starting..." : "Start Free Trial"}
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleContinueFree} style={styles.restoreButton}>
          <Text style={styles.restoreText}>Continue with free plan</Text>
        </Pressable>

        <Text style={styles.trialNote}>
          3-day free trial, then{" "}
          {selectedPlan === "monthly" ? "$4.99/month" : "$39/year"}.{"\n"}
          Cancel anytime before trial ends.
        </Text>

        <View style={styles.linksRow}>
          <Text style={styles.link}>Terms of Service</Text>
          <Text style={styles.linkDivider}>•</Text>
          <Text style={styles.link}>Privacy Policy</Text>
          <Text style={styles.linkDivider}>•</Text>
          <Text style={styles.link}>Restore Purchases</Text>
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
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    textAlign: "center",
  },
  plansRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  planCard: {
    flex: 1,
    backgroundColor: "#1A1A35",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#252545",
    overflow: "hidden",
    gap: 4,
  },
  planCardSelected: {
    borderColor: "#7B6CFF",
  },
  planLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#9B9BBF",
  },
  planPrice: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  planPer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A5A7A",
  },
  saveBadge: {
    backgroundColor: "#7B6CFF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  saveBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  featuresCard: {
    backgroundColor: "#1A1A35",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    gap: 14,
    borderWidth: 1,
    borderColor: "#252545",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#7B6CFF15",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    flex: 1,
  },
  ctaButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  restoreButton: {
    paddingVertical: 4,
  },
  restoreText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
  },
  trialNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A5A7A",
    textAlign: "center",
    lineHeight: 18,
  },
  linksRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  link: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#5A5A7A",
  },
  linkDivider: {
    fontSize: 11,
    color: "#5A5A7A",
  },
});

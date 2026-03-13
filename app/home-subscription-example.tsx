/**
 * Example implementation in your home.tsx screen
 * Shows how to check subscription status and enforce limits
 */

import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useSubscription } from "@/context/SubscriptionContext";
import { apiRequest } from "@/lib/query-client";
import { router } from "expo-router";

export default function HomeScreen() {
  const {
    subscriptionStatus,
    dailyLimit,
    loading,
    canAnalyzeConversation,
    getRemainingAnalyses,
  } = useSubscription();
  const [analyzing, setAnalyzing] = useState(false);

  /**
   * Handle analyzing a conversation with subscription check
   */
  const handleAnalyzeConversation = async (text: string) => {
    // STEP 1: Check if user can analyze
    if (!canAnalyzeConversation()) {
      if (subscriptionStatus?.plan === "free") {
        // Free user with no remaining analyses
        Alert.alert(
          "Daily Limit Reached",
          "You've used your 2 daily free analyses. Subscribe for unlimited access.",
          [
            {
              text: "Subscribe Now",
              onPress: () => router.push("/paywall"),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      }
      return;
    }

    // STEP 2: Continue with analysis
    setAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/analyze", { text });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Success - show results
      router.push({
        pathname: "/result",
        params: {
          data: JSON.stringify(data),
          inputText: text,
        },
      });
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading subscription info...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Display subscription status */}
      <View style={{ marginBottom: 20, padding: 16, backgroundColor: "#f0f0f0", borderRadius: 8 }}>
        {subscriptionStatus?.isTrialActive ? (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
              🎉 Free Trial Active
            </Text>
            <Text>Days remaining: {subscriptionStatus.daysRemaining}</Text>
            <Text>Unlimited analyses available</Text>
          </View>
        ) : subscriptionStatus?.isPaid ? (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
              ✅ Premium Subscriber
            </Text>
            <Text>Unlimited analyses available</Text>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
              Free Plan
            </Text>
            <Text>
              Analyses used today: {dailyLimit?.used ?? 0} / {dailyLimit?.dailyLimit ?? 2}
            </Text>
            <Text>Remaining: {getRemainingAnalyses()}</Text>

            {/* Show call-to-action if free user is about to hit limit */}
            {dailyLimit && dailyLimit.remaining <= 1 && dailyLimit.remaining > 0 && (
              <Pressable
                onPress={() => router.push("/paywall")}
                style={{
                  marginTop: 12,
                  padding: 8,
                  backgroundColor: "#7B6CFF",
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                  Upgrade Before Limit Ends
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Main Analyze Button */}
      <Pressable
        onPress={() => {
          // Get conversation text from wherever you collect it
          const conversationText = "Your conversation text here";
          handleAnalyzeConversation(conversationText);
        }}
        disabled={analyzing}
        style={{
          padding: 16,
          backgroundColor: "#7B6CFF",
          borderRadius: 8,
          opacity: analyzing ? 0.5 : 1,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", textAlign: "center", fontSize: 16 }}>
          {analyzing ? "Analyzing..." : "Analyze Conversation"}
        </Text>
      </Pressable>

      {/* Start Free Trial Button (only show if user is free and not trialed yet) */}
      {!subscriptionStatus?.isSubscribed && (
        <Pressable
          onPress={async () => {
            const { startTrial } = useSubscription();
            await startTrial();
          }}
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: "#4CAF7D",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
            Start Free 30-Day Trial
          </Text>
        </Pressable>
      )}
    </View>
  );
}

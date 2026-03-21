/**
 * Frontend Subscription Management Hook
 * app/context/SubscriptionContext.tsx
 * 
 * Manages:
 * - Fetching subscription status on app launch
 * - Starting free trial
 * - Tracking daily limits
 * - Showing paywall when trial expires
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useApp } from "./AppContext";
import { apiRequest } from "@/lib/query-client";
import { Alert } from "react-native";

export interface SubscriptionStatus {
  isSubscribed: boolean;
  isPaid: boolean;
  isTrialActive: boolean;
  plan: "free-trial" | "premium" | "free";
  trialExpiresAt?: string;
  subscriptionExpiresAt?: string;
  daysRemaining?: number;
}

interface DailyLimitData {
  dailyLimit: number;
  used: number;
  remaining: number;
  isUnlimited: boolean;
  plan: string;
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  dailyLimit: DailyLimitData | null;
  loading: boolean;
  error: string | null;
  startTrial: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  canAnalyzeConversation: () => boolean;
  getRemainingAnalyses: () => number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { deviceId } = useApp();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [dailyLimit, setDailyLimit] = useState<DailyLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current subscription status
   * Called on app launch and after starting trial
   */
  const refreshSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch subscription status
      const statusRes = await apiRequest("GET", "/api/subscription/status");
      const statusData = await statusRes.json();
      setSubscriptionStatus(statusData);

      // Fetch daily limit info
      const limitRes = await apiRequest("GET", "/api/subscription/daily-limit");
      const limitData = await limitRes.json();
      setDailyLimit(limitData);

      // EDGE CASE: Trial expired, show paywall
      if (
        subscriptionStatus?.isTrialActive &&
        !statusData.isTrialActive &&
        !statusData.isPaid
      ) {
        Alert.alert(
          "Your Trial Ended",
          "Your 3-day free trial has ended. Subscribe now to continue using GhostReply!",
          [
            {
              text: "Subscribe Now",
              onPress: () => {
                // Navigate to paywall
              },
              style: "default",
            },
            {
              text: "Continue Free",
              onPress: () => {
                // Continue with limited free plan
              },
              style: "cancel",
            },
          ]
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch subscription status";
      console.error("[Subscription] Error:", message);
      setError(message);
      // Don't block the app - assume free user on error
      setSubscriptionStatus({
        isSubscribed: false,
        isPaid: false,
        isTrialActive: false,
        plan: "free",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start a 3-day free trial
   */
  const startTrial = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiRequest("POST", "/api/subscription/start-trial");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start trial");
      }

      setSubscriptionStatus(data);

      Alert.alert(
        "🎉 Trial Started!",
        `You have ${data.daysRemaining} days of unlimited access. Enjoy GhostReply Pro!`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start trial";
      console.error("[Subscription] Start trial error:", message);
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user can analyze a conversation
   * Returns false only for free users who hit daily limit
   */
  const canAnalyzeConversation = (): boolean => {
    if (!subscriptionStatus) return false;

    // Trial users and paid users can always analyze
    if (subscriptionStatus.isSubscribed) return true;

    // Free users can analyze if they have limit remaining
    if (dailyLimit && dailyLimit.remaining > 0) return true;

    return false;
  };

  /**
   * Get number of remaining analyses for today
   */
  const getRemainingAnalyses = (): number => {
    if (!subscriptionStatus) return 0;

    // Trial users and paid users have unlimited
    if (subscriptionStatus.isSubscribed) return Infinity;

    // Free users return remaining count
    return dailyLimit?.remaining ?? 0;
  };

  /**
   * Fetch subscription status on app launch
   */
  useEffect(() => {
    if (deviceId) {
      refreshSubscriptionStatus();
    }
  }, [deviceId]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        dailyLimit,
        loading,
        error,
        startTrial,
        refreshSubscriptionStatus,
        canAnalyzeConversation,
        getRemainingAnalyses,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}

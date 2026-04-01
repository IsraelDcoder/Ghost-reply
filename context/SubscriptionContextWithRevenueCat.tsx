/**
 * Updated Subscription Management with RevenueCat
 * context/SubscriptionContext.tsx
 *
 * Manages:
 * - RevenueCat SDK initialization
 * - Tracking subscription status
 * - Daily analysis limits
 * - Trial and premium state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";
import {
  initializeRevenueCat,
  getCustomerInfo,
  checkEntitlement,
  purchasePackage,
  restorePurchases,
  syncPurchases,
  ENTITLEMENT_ID,
  PRODUCTS,
  getAvailableOfferings,
} from "@/lib/revenueCat";
import { useApp } from "./AppContext";
import { apiRequest } from "@/lib/query-client";

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

interface PurchaseOffering {
  identifier: string;
  displayName: string;
  packageType: "WEEKLY" | "MONTHLY";
  price: string;
}

interface SubscriptionContextType {
  // Status
  subscriptionStatus: SubscriptionStatus | null;
  dailyLimit: DailyLimitData | null;
  loading: boolean;
  error: string | null;
  isPro: boolean; // 🔥 EXPLICIT PRO STATE - use this in all limit checks

  // Actions
  purchaseSubscription: (productID: string) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;

  // Utilities
  canAnalyzeConversation: () => boolean;
  getRemainingAnalyses: () => number;
  getAvailableOfferingsList: () => Promise<PurchaseOffering[]>;
  shouldBypassPaywall: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { deviceId } = useApp();

  // State
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [dailyLimit, setDailyLimit] = useState<DailyLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isPro, setIsPro] = useState(false); // 🔥 Global PRO state

  /**
   * Initialize RevenueCat on app start
   */
  useEffect(() => {
    const initializeSubscriptions = async () => {
      try {
        setLoading(true);
        
        if (!deviceId) {
          console.log("[Subscription] Waiting for deviceId...");
          return;
        }
        
        console.log("[Subscription] Initializing RevenueCat with deviceId:", deviceId);

        // Initialize RevenueCat SDK with device ID for webhook correlation
        await initializeRevenueCat(deviceId);

        // Fetch initial subscription status
        await refreshSubscriptionStatus();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Initialization failed";
        console.error("[Subscription] Init error:", errorMessage);
        setError(errorMessage);
        // Don't throw - let app continue with free tier
      } finally {
        setLoading(false);
      }
    };

    initializeSubscriptions();
  }, [deviceId]);

  /**
   * Listen for app foreground/background changes
   * Refresh subscription when app returns to foreground
   */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      console.log("[Subscription] App came to foreground - refreshing status");
      await refreshSubscriptionStatus();
    }

    setAppState(nextAppState);
  };

  /**
   * Fetch current subscription status from RevenueCat
   * Falls back to backend for daily limits
   */
  const refreshSubscriptionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[Subscription] Refreshing subscription status...");

      // Check if user has premium entitlement via RevenueCat
      const hasPremium = await checkEntitlement(ENTITLEMENT_ID);

      // Fetch customer info for detailed subscription data
      const customerInfo = await getCustomerInfo();

      console.log("[Subscription] Entitlement check - hasPremium:", hasPremium, "entitlementID:", ENTITLEMENT_ID);

      // Determine subscription state
      let status: SubscriptionStatus;
      let isProUser = false; // 🔥 Track PRO status

      if (hasPremium) {
        // User has active premium entitlement
        const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        status = {
          isSubscribed: true,
          isPaid: true,
          isTrialActive: false,
          plan: "premium",
          subscriptionExpiresAt: premiumEntitlement?.expirationDate ?? undefined,
        };
        isProUser = true; // 🔥 User is PRO
        console.log("[Subscription] ✓ Premium subscription is ACTIVE - isPro = TRUE");
      } else if (Object.keys(customerInfo.entitlements.active).length === 0) {
        // No active entitlements - check backend for free trial
        try {
          const backendStatusRes = await apiRequest("GET", "/api/subscription/status");
          const backendStatus = await backendStatusRes.json();

          status = backendStatus;
          isProUser = backendStatus.isTrialActive; // 🔥 Trial users are also PRO
          console.log("[Subscription] Backend status - plan:", backendStatus.plan, "isTrialActive:", backendStatus.isTrialActive);
        } catch (err) {
          // Backend error - assume free tier
          console.warn("[Subscription] Backend status fetch failed, assuming free tier");
          status = {
            isSubscribed: false,
            isPaid: false,
            isTrialActive: false,
            plan: "free",
          };
          isProUser = false;
        }
      } else {
        status = {
          isSubscribed: false,
          isPaid: false,
          isTrialActive: false,
          plan: "free",
        };
        isProUser = false;
      }

      setSubscriptionStatus(status);
      setIsPro(isProUser); // 🔥 SET GLOBAL isPro STATE

      // Fetch daily limit from backend
      const limitRes = await apiRequest("GET", "/api/subscription/daily-limit");
      const limitData = await limitRes.json();
      setDailyLimit(limitData);

      console.log("[Subscription] ✓ Status updated:", {
        plan: status.plan,
        isPaid: status.isPaid,
        isTrialActive: status.isTrialActive,
        remaining: limitData.remaining,
        isPro: isProUser,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Status refresh failed";
      console.error("[Subscription] Error refreshing status:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Purchase a subscription via RevenueCat
   * 🔥 CRITICAL: Immediately refreshes entitlements after successful purchase
   */
  const purchaseSubscription = useCallback(
    async (productID: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        console.log("[Subscription] 🔥 Attempting purchase:", productID);

        const result = await purchasePackage(productID);

        // Handle cancelled purchase - don't treat as error
        if (result.wasCancelled) {
          console.log("[Subscription] Purchase was cancelled by user");
          setLoading(false);
          return false;
        }

        if (!result.success) {
          throw new Error(result.error || "Purchase failed");
        }

        console.log("[Subscription] 🔥 Purchase successful! Verifying entitlement...");

        // 🔥 FORCE SYNC: Wait for RevenueCat to propagate purchase
        console.log("[Subscription] 🔥 Force syncing purchases with RevenueCat...");
        try {
          await syncPurchases();
          console.log("[Subscription] ✓ Purchases synced");
        } catch (syncErr) {
          console.warn("[Subscription] Warning: syncPurchases failed:", syncErr);
        }

        // Verify premium entitlement is active from purchase response
        if (result.customerInfo) {
          const premiumEntitlement = result.customerInfo.entitlements.active[ENTITLEMENT_ID];
          
          if (!premiumEntitlement) {
            console.warn("[Subscription] Entitlement not found immediately after purchase, waiting for sync...");
            // Wait a bit for RevenueCat backend to sync
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }

        // 🔥 CRITICAL: Refresh subscription status immediately
        // This ensures isPro is set to TRUE right after purchase
        console.log("[Subscription] 🔥 Confirming purchase with backend...");
        
        try {
          // Tell backend about the purchase (needed until webhook is configured)
          const confirmRes = await apiRequest("POST", "/api/subscription/confirm-purchase", {
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          });
          const confirmData = await confirmRes.json();
          console.log("[Subscription] 🔥 Backend confirmed purchase:", confirmData);
        } catch (err) {
          console.warn("[Subscription] Warning: Could not confirm with backend, but purchase succeeded on client:", err);
          // Don't fail the purchase flow - client-side purchase succeeded
        }

        console.log("[Subscription] 🔥 Refreshing subscription status...");
        await refreshSubscriptionStatus();

        console.log("[Subscription] 🔥 Purchase flow complete, status refreshed, isPro should be TRUE");
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Purchase failed";
        console.error("[Subscription] Purchase error:", errorMessage);
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshSubscriptionStatus]
  );

  /**
   * Restore previous purchases
   */
  const handleRestorePurchases = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[Subscription] Restoring purchases...");

      const result = await restorePurchases();

      if (!result.success) {
        throw new Error(result.error || "Restore failed");
      }

      // Refresh status
      await refreshSubscriptionStatus();

      Alert.alert("Success", "Your purchases have been restored!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Restore failed";
      console.error("[Subscription] Restore error:", errorMessage);
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshSubscriptionStatus]);

  /**
   * Get available offerings for purchase
   */
  const getAvailableOfferingsList = useCallback(async (): Promise<PurchaseOffering[]> => {
    try {
      const offerings = await getAvailableOfferings();

      if (!offerings) {
        return [];
      }

      return offerings.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        displayName: pkg.product.title,
        packageType: pkg.identifier.includes("weekly")
          ? "WEEKLY"
          : pkg.identifier.includes("monthly")
            ? "MONTHLY"
            : "WEEKLY",
        price: pkg.product.priceString,
      }));
    } catch (err) {
      console.error("[Subscription] Error fetching offerings:", err);
      return [];
    }
  }, []);

  /**
   * Check if user can analyze a conversation
   * 🔥 NEW: Uses explicit isPro state for immediate logic
   */
  const canAnalyzeConversation = (): boolean => {
    // 🔥 MAIN CHECK: If user is PRO (paid or trial), unlimited access
    if (isPro) {
      return true;
    }

    // If not PRO, check daily limit for free users
    if (dailyLimit && dailyLimit.remaining > 0) {
      return true;
    }

    return false; // No access
  };

  /**
   * Get remaining analyses for the day
   * 🔥 NEW: Uses explicit isPro state
   */
  const getRemainingAnalyses = (): number => {
    if (isPro) {
      return -1; // Unlimited for PRO users
    }

    return dailyLimit?.remaining ?? 0; // Return daily limit for free users
  };

  /**
   * Check if user should bypass the paywall
   * Returns true if user already has an active subscription or trial
   */
  const shouldBypassPaywall = (): boolean => {
    if (!subscriptionStatus) {
      return false; // Still loading, show paywall
    }

    const hasPaidSubscription = subscriptionStatus.isPaid;
    const hasActiveTrial = subscriptionStatus.isTrialActive;

    if (hasPaidSubscription) {
      console.log("[Subscription] Bypassing paywall - user has paid subscription");
      return true;
    }

    if (hasActiveTrial) {
      console.log("[Subscription] Bypassing paywall - user has active trial");
      return true;
    }

    return false;
  };

  const contextValue: SubscriptionContextType = {
    subscriptionStatus,
    dailyLimit,
    loading,
    error,
    isPro, // 🔥 Export isPro state
    purchaseSubscription,
    restorePurchases: handleRestorePurchases,
    refreshSubscriptionStatus,
    canAnalyzeConversation,
    getRemainingAnalyses,
    getAvailableOfferingsList,
    shouldBypassPaywall,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to use subscription context
 */
export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }

  return context;
}

/**
 * RevenueCat Configuration & Utilities
 * lib/revenueCat.ts
 *
 * Handles:
 * - SDK initialization with API key
 * - Product configuration and offerings
 * - Entitlement checking
 * - Customer info management
 * - Error handling and logging
 */

import Purchases, {
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL,
  PURCHASE_TYPE,
} from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat Configuration
const REVENUE_CAT_API_KEY = "goog_KjDXZHafRRKrhUdeEZzGOOrnCsI";
export const ENTITLEMENT_ID = "GhostReply Pro"; // Must match Play Console offering

// Product IDs - must match Play Console exact IDs
export const PRODUCTS = {
  WEEKLY: "com.ghostreply.premium.weekly:com-ghostreply-premium-weekly",
  MONTHLY: "com.ghostreply.premium.monthly:com-ghostreply-premium-monthly",
};

// Offering ID (grouping of products)
export const OFFERING_ID = "default";

/**
 * Initialize RevenueCat SDK
 * Called once on app startup
 * @param deviceId - Device ID from app context (must match backend user ID)
 */
export async function initializeRevenueCat(deviceId: string): Promise<void> {
  try {
    // Enable verbose logging in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    } else {
      Purchases.setLogLevel(LOG_LEVEL.INFO);
    }

    // Initialize SDK with API key
    // CRITICAL: appUserID must match the device ID used by backend
    // This ensures webhook events have the correct user ID
    await Purchases.configure({
      apiKey: REVENUE_CAT_API_KEY,
      appUserID: deviceId, // Match backend device ID for webhook correlation
    });

    console.log("[RevenueCat] Initialized with appUserID:", deviceId);
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch customer subscription status
 * Returns: CustomerInfo with entitlements and purchase info
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if user has active entitlement
 * Returns: boolean indicating if "GhostReply Pro" entitlement is active
 */
export async function checkEntitlement(
  entitlementID: string = ENTITLEMENT_ID
): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[entitlementID];

    if (entitlement) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get available products/offerings
 * Used to populate paywall with pricing
 */
export async function getAvailableOfferings() {
  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      return null;
    }

    return offerings.current;
  } catch (error) {
    throw error;
  }
}

/**
 * Purchase a subscription package
 * Handles the purchase flow with error handling
 */
export async function purchasePackage(packageID: string): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  wasCancelled?: boolean;
}> {
  try {
    // Get offerings first
    const offerings = await getAvailableOfferings();
    if (!offerings) {
      throw new Error("No offerings available");
    }

    // Find the package
    const packageToPurchase = offerings.availablePackages.find(
      (p) => p.identifier === packageID
    );

    if (!packageToPurchase) {
      throw new Error(`Package not found: ${packageID}`);
    }

    console.log("[RevenueCat] Making purchase for:", packageID);

    // Make purchase
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    console.log("[RevenueCat] Purchase completed, checking entitlements...");
    console.log("[RevenueCat] Customer Info:", {
      appUserID: customerInfo.originalAppUserId,
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
    });

    // Verify premium entitlement is active
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    if (!premiumEntitlement) {
      console.warn("[RevenueCat] Purchase completed but premium entitlement not active yet");
      // Still return success since the purchase was made - entitlement may activate shortly
      return {
        success: true,
        customerInfo,
      };
    }

    console.log("[RevenueCat] Premium entitlement confirmed active");

    return {
      success: true,
      customerInfo,
    };
  } catch (error) {
    const purchaseError = error as PurchasesError;

    // Log the error details
    console.error("[RevenueCat] Purchase error:", {
      message: purchaseError.message,
      code: purchaseError.code,
    });

    // Handle user cancelled - don't show error alert for this
    if (
      purchaseError.message?.includes("Client error") ||
      purchaseError.message?.includes("Cancel") ||
      purchaseError.message?.includes("cancelled") ||
      purchaseError.message?.includes("user cancel")
    ) {
      console.log("[RevenueCat] Purchase was cancelled by user");
      return {
        success: false,
        error: "Purchase cancelled",
        wasCancelled: true,
      };
    }

    if (purchaseError.message && purchaseError.message.includes("not available")) {
      return {
        success: false,
        error: "Product not available",
        wasCancelled: false,
      };
    }

    return {
      success: false,
      error: purchaseError.message || "Purchase failed",
      wasCancelled: false,
    };
  }
}

/**
 * Restore previous purchases
 * Useful when user reinstalls app or switches devices
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();

    return {
      success: true,
      customerInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Restore failed",
    };
  }
}

/**
 * Logout user (reset to anonymous)
 * Clears current user ID and associated purchases
 */
export async function logout(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (error) {
    throw error;
  }
}

/**
 * Get App User ID (RevenueCat unique identifier)
 */
export async function getAppUserID(): Promise<string> {
  try {
    const appUserID = await Purchases.getAppUserID();
    return appUserID;
  } catch (error) {
    throw error;
  }
}

/**
 * Set custom App User ID for linking to backend user
 * Call this when user logs in / creates account
 */
export async function setAppUserID(userID: string): Promise<void> {
  try {
    await Purchases.logIn(userID);
  } catch (error) {
    throw error;
  }
}

/**
 * Format price for display
 * Takes product price object and returns formatted string
 */
export function formatPrice(priceString: string): string {
  return priceString;
}

/**
 * Type definitions for subscription state
 */
export interface SubscriptionState {
  isLoading: boolean;
  isPremium: boolean;
  activeEntitlements: string[];
  nextRenewalDate?: Date;
  expirationDate?: Date;
  error?: string;
}

export interface PaywallProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceString: string;
  period: string;
}

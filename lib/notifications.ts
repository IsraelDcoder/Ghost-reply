import * as Notifications from "expo-notifications";
import { router } from "expo-router";

/**
 * Notification Handler - Client-side notification management
 * Registers notification listeners and handles notification responses
 */

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Show notification even if app is in foreground
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

/**
 * Initialize notification listeners
 * Must be called once on app startup (_layout.tsx)
 */
export function initializeNotificationListeners() {
  // Handle notification response when user taps on notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      handleNotificationResponse(response.notification);
    }
  );

  // Handle notifications that arrive while app is in foreground
  const notificationSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      // Optional: log or track received notifications
    }
  );

  // Cleanup function - return unsubscribe
  return () => {
    responseSubscription.remove();
    notificationSubscription.remove();
  };
}

/**
 * Handle notification response (when user taps on notification)
 */
function handleNotificationResponse(notification: Notifications.Notification) {
  const action = notification.request.content.data?.action as string;

  switch (action) {
    case "trial_expiring":
      // Navigate to paywall on trial expiration warning
      router.push("/paywall");
      break;

    case "trial_expired_upsell":
      // Navigate to paywall for conversion
      router.push("/paywall");
      break;

    case "daily_limit_reset":
      // Navigate to home for new replies
      router.push("/home");
      break;

    case "subscription_success":
      // Navigate to home to celebrate upgrade
      router.push("/home");
      break;

    case "engagement":
      // Navigate to home to open app
      router.push("/home");
      break;

    default:
      // Default action - go home
      router.push("/home");
  }
}

/**
 * Request notification permissions and get token
 * Returns Expo push token or null if permission denied
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Always request permissions first
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Get the token for the device
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })
    ).data;

    return token;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

/**
 * Send device's push token to backend
 */
export async function registerPushTokenWithBackend(
  token: string,
  deviceId: string
) {
  try {
    const domain = process.env.EXPO_PUBLIC_DOMAIN || "http://localhost:3000";
    const response = await fetch(`${domain}/api/notifications/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Id": deviceId,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      console.error("Failed to register push token");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error registering push token:", error);
    return false;
  }
}

/**
 * Send test notification (development only)
 */
export async function sendTestNotification(
  token: string,
  deviceId: string
): Promise<boolean> {
  try {
    const domain = process.env.EXPO_PUBLIC_DOMAIN || "http://localhost:3000";
    const response = await fetch(`${domain}/api/notifications/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Id": deviceId,
      },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending test notification:", error);
    return false;
  }
}

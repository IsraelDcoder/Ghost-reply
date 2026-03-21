import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient, setDeviceId } from "@/lib/query-client";
import { AppProvider, useApp } from "@/context/AppContext";
import { SubscriptionProvider } from "@/context/SubscriptionContextWithRevenueCat";
import { initializeRevenueCat } from "@/lib/revenueCat";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="home" />
      <Stack.Screen name="history" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="result" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}

// Inner component that has access to useApp
function RootLayoutWithApp() {
  const { deviceId } = useApp();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Initialize RevenueCat SDK on app start
  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        await initializeRevenueCat();
      } catch (error) {
        // App continues even if RevenueCat fails
      }
    };

    setupRevenueCat();
  }, []);

  useEffect(() => {
    if (deviceId) {
      setDeviceId(deviceId);
    }
  }, [deviceId]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <SubscriptionProvider>
        <RootLayoutWithApp />
      </SubscriptionProvider>
    </AppProvider>
  );
}

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
  SlideInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Animations,
} from "@/constants/designTokens";
import { Button } from "@/components/Button";

const { width, height } = Dimensions.get("window");

type OnboardingScreen =
  | "welcome"
  | "problem"
  | "solution"
  | "features"
  | "cta";

interface ScreenContent {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
}

const SCREENS: Record<OnboardingScreen, ScreenContent> = {
  welcome: {
    icon: "briefcase",
    title: "Communicate Like a Top Freelancer",
    subtitle: "Your AI Communication Coach",
    description:
      "Every client conversation matters. GhostReply helps you communicate professionally from your first message to your final invoice.",
  },
  problem: {
    icon: "chat-processing",
    title: "Negotiate With Confidence",
    subtitle: "Master Difficult Conversations",
    description:
      "Handle pricing discussions, scope creep, and payment requests with clarity and professionalism. Build stronger client relationships.",
  },
  solution: {
    icon: "lightning-bolt",
    title: "Get Paid Faster",
    subtitle: "Request Payments Professionally",
    description:
      "No more awkward payment reminders. GhostReply helps you request payments with confidence and professionalism.",
  },
  features: {
    icon: "lightbulb-on",
    title: "Your Professional Advantage",
    subtitle: "AI-Powered Insights",
    description:
      "Understand client psychology, receive strategic coaching, and learn communication patterns that win more clients.",
  },
  cta: {
    icon: "rocket-launch",
    title: "Ready to Level Up?",
    subtitle: "Start Your Free Trial",
    description:
      "Join freelancers who earn more, lose less sleep, and build stronger client relationships.",
  },
};

function OnboardingIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <View style={styles.indicatorContainer}>
      {Array.from({ length: total }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.indicatorDot,
            {
              backgroundColor:
                index === current ? Colors.primary : Colors.dark.bgTertiary,
              width: index === current ? 32 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

function ScreenContent({ screen }: { screen: OnboardingScreen }) {
  const content = SCREENS[screen];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.screenContainer}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: BorderRadius.xl,
            backgroundColor: Colors.primary + "20",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name={content.icon as any}
            size={40}
            color={Colors.primary}
          />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{content.title}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>{content.subtitle}</Text>

      {/* Description */}
      <Text style={styles.description}>{content.description}</Text>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setHasOnboarded } = useApp();
  const { shouldBypassPaywall } = useSubscription();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [currentScreen, setCurrentScreen] = useState<number>(0);

  const screenKeys: OnboardingScreen[] = [
    "welcome",
    "problem",
    "solution",
    "features",
    "cta",
  ];

  const handleNext = () => {
    if (currentScreen < screenKeys.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextScreen = currentScreen + 1;
      setCurrentScreen(nextScreen);

      // Scroll to the next page
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: width * nextScreen,
          animated: true,
        });
      }, 100);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    await setHasOnboarded(true);
    if (shouldBypassPaywall()) {
      router.replace("/home");
    } else {
      router.replace("/paywall");
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen(screenKeys.length - 1);
    scrollViewRef.current?.scrollTo({
      x: width * (screenKeys.length - 1),
      animated: true,
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Skip Button */}
      {currentScreen < screenKeys.length - 1 && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Screens */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {screenKeys.map((screenKey) => (
          <View
            key={screenKey}
            style={[styles.page, { width }]}
          >
            <ScreenContent screen={screenKey} />
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Spacing[4] }]}>
        {/* Indicators */}
        <OnboardingIndicator
          current={currentScreen}
          total={screenKeys.length}
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {currentScreen < screenKeys.length - 1 ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleNext}
            >
              Continue
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleGetStarted}
              >
                Start Free Trial
              </Button>
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onPress={handleSkip}
                style={{ marginTop: Spacing[2] }}
              >
                Continue with Limited Access
              </Button>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bgPrimary,
  } as const,

  skipButton: {
    position: "absolute" as const,
    top: 0,
    right: Spacing[4],
    zIndex: 10,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  } as const,

  skipText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.sizes.base,
    fontWeight: "600" as const,
  } as const,

  scrollView: {
    flex: 1,
  } as const,

  scrollContent: {
    flexGrow: 1,
  } as const,

  page: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: Spacing[4],
  } as const,

  screenContainer: {
    alignItems: "center" as const,
    gap: Spacing[6],
  } as const,

  iconContainer: {
    marginBottom: Spacing[2],
  } as const,

  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: Colors.dark.textPrimary,
    textAlign: "center",
  } as const,

  subtitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: Colors.primary,
  } as const,

  description: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
    letterSpacing: 0,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    maxWidth: 340,
  } as const,

  footer: {
    gap: Spacing[6],
    paddingHorizontal: Spacing[4],
  },

  indicatorContainer: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: Spacing[2],
  } as const,

  indicatorDot: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.bgTertiary,
  } as const,

  buttonContainer: {
    gap: Spacing[2],
  } as const,
});

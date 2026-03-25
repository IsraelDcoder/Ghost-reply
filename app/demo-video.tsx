/**
 * GhostReply Premium Onboarding - Rizz-Inspired Design
 * 
 * Flow:
 * 1. Splash: "GHOSTREPLY" (dark gradient)
 * 2. Credibility: Media logos + branding
 * 3. Product Demo: Upload chat screenshot with replies
 * 4. Feature Demo: Show instant replies + features
 * 5. Launch: App splash
 * 6. CTA: Start free trial
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

/**
 * Chat sequences for demo
 */
const DEMO_REPLIES = [
  {
    user: "Have you heard that 29 is too old for Leo? Well, that makes you just right for me 😏",
    emoji: "💬",
  },
  {
    user: "Is cuffing season over yet, or can I still get arrested by a cute cop?",
    emoji: "😏",
  },
  {
    user: "I think Leonardo would be jealous of how gorgeous you are, Alisa.",
    emoji: "✨",
  },
  {
    user: "You can call me Leonardo Da Vinci, cause ill make you Moan Alisa.",
    emoji: "🔥",
  },
  {
    user: "Looks like we have a lot to investigate 😉",
    emoji: "👀",
  },
];

type SlideProps = {
  fadeAnim: Animated.Value;
};

/**
 * Slide 1: Splash Screen - Bold Branding
 */
const SplashScreenOne = ({ fadeAnim }: SlideProps) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <Animated.View
      style={[
        styles.slide,
        { backgroundColor: "#0B0B1A", opacity: fadeAnim },
      ]}
    >
      <LinearGradient
        colors={["rgba(236, 72, 153, 0.2)", "rgba(139, 92, 246, 0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
      />
      <View style={styles.splashContent}>
        <Animated.Text
          style={[
            styles.splashTitle,
            { transform: [{ scale: scale }] },
          ]}
        >
          GHOSTREPLY
        </Animated.Text>
        <Text style={styles.splashSubtitle}>AI-Powered Replies</Text>
      </View>
    </Animated.View>
  );
};

/**
 * Slide 2: Media Credibility & Branding
 */
const CredibilityScreen = ({ fadeAnim }: SlideProps) => {
  const logoScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.slide,
        { backgroundColor: "#000000", opacity: fadeAnim },
      ]}
    >
      <View style={styles.credibilityContent}>
        <Text style={styles.credibilityTitle}>GHOSTREPLY</Text>

        <Text style={styles.credibilitySubtitle}>— As featured on —</Text>

        <View style={styles.mediaLogoGrid}>
          <Text style={styles.mediaLogo}>TechCrunch</Text>
          <Text style={styles.mediaLogo}>Product Hunt</Text>
          <Text style={styles.mediaLogo}>Dev.to</Text>
          <Text style={styles.mediaLogo}>Hacker News</Text>
        </View>

        <Text style={styles.credibilityFooter}>
          Trusted by 50k+ users
        </Text>
      </View>
    </Animated.View>
  );
};

/**
 * Slide 3: Product Demo - Chat Upload with Replies
 */
const ProductDemoSlide = ({ fadeAnim }: SlideProps) => {
  const cardScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.slide,
        { backgroundColor: "#0F0B1A", opacity: fadeAnim },
      ]}
    >
      <LinearGradient
        colors={["rgba(236, 72, 153, 0.15)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.demoScrollContent}
      >
        <Text style={styles.demoTitle}>Upload a chat or bio</Text>
        <Text style={styles.demoSubtitle}>
          Share your chat or bioscreen shots to{"\n"}get personalized AI replies
        </Text>

        {/* Profile Card Demo */}
        <Animated.View
          style={[
            styles.profileCard,
            { transform: [{ scale: cardScale }] },
          ]}
        >
          <View style={styles.profileImage}>
            <Text style={styles.profileImagePlaceholder}>Photo</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Alisa, 29</Text>
            <View style={styles.profileMeta}>
              <Text style={styles.profileRole}>👮 Police Officer</Text>
              <Text style={styles.profileDistance}>9 miles away</Text>
            </View>
          </View>
          <Text style={styles.profileLike}>❤️</Text>
        </Animated.View>

        {/* Profile Bio */}
        <View style={styles.profileBio}>
          <Text style={styles.bioTitle}>About Me</Text>
          <Text style={styles.bioText}>
            My favorite actor is Leonardo DiCaprio cuz he's the sexiest man alive. Am I wrong?
          </Text>
        </View>

        {/* Instant Replies Header */}
        <Text style={styles.repliesHeader}>👇 Instant Replies 👇</Text>

        {/* Reply Options */}
        <View style={styles.repliesContainer}>
          {DEMO_REPLIES.map((reply, idx) => (
            <View key={idx} style={styles.replyOption}>
              <Text style={styles.replyText}>{reply.user}</Text>
              <Text style={styles.replyEmoji}>{reply.emoji}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

/**
 * Slide 4: Features Showcase
 */
const FeaturesSlide = ({ fadeAnim }: SlideProps) => {
  return (
    <Animated.View
      style={[
        styles.slide,
        { backgroundColor: "#0B0B1A", opacity: fadeAnim },
      ]}
    >
      <LinearGradient
        colors={["rgba(78, 205, 196, 0.1)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.featuresScrollContent}
        scrollEnabled={false}
      >
        <View style={{ marginTop: 80 }}>
          <Text style={styles.featuresTitle}>What You Get</Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureHeading}>Instant Replies</Text>
                <Text style={styles.featureDesc}>Multiple options in seconds</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureHeading}>Tone Matched</Text>
                <Text style={styles.featureDesc}>Never sounds robotic</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔥</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureHeading}>Witty & Charming</Text>
                <Text style={styles.featureDesc}>Stand out from the crowd</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✨</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureHeading}>Context Aware</Text>
                <Text style={styles.featureDesc}>Understands the conversation</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.nextButton,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.replace("/onboarding");
        }}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Main Onboarding Screen
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnimValues = useRef([0, 1, 2, 3].map(() => new Animated.Value(0)))
    .current;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    Animated.timing(fadeAnimValues[0], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);

    if (newIndex !== currentIndex && newIndex < 4) {
      setCurrentIndex(newIndex);

      Animated.timing(fadeAnimValues[newIndex], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const slides = [
    <SplashScreenOne key="splash1" fadeAnim={fadeAnimValues[0]} />,
    <CredibilityScreen key="cred" fadeAnim={fadeAnimValues[1]} />,
    <ProductDemoSlide key="demo" fadeAnim={fadeAnimValues[2]} />,
    <FeaturesSlide key="features" fadeAnim={fadeAnimValues[3]} />,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => item}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEnabled
        showsHorizontalScrollIndicator={false}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  slide: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },

  /* Splash Screens */
  splashContent: {
    alignItems: "center",
    zIndex: 10,
  },

  splashTitle: {
    fontSize: 72,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -2,
    textAlign: "center",
    lineHeight: 80,
  },

  splashSubtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#EC4899",
    marginTop: 16,
    letterSpacing: 1,
  },

  /* Credibility Screen */
  credibilityContent: {
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: 20,
  },

  credibilityTitle: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 28,
    textAlign: "center",
  },

  credibilitySubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#80B0C0",
    letterSpacing: 1,
    marginBottom: 24,
  },

  mediaLogoGrid: {
    width: "100%",
    gap: 16,
    marginBottom: 32,
  },

  mediaLogo: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },

  credibilityFooter: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4ECDC4",
  },

  /* Product Demo */
  demoScrollContent: {
    paddingVertical: 40,
    paddingHorizontal: 0,
    zIndex: 10,
  },

  demoTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },

  demoSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#B0B0C0",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },

  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(78, 205, 196, 0.2)",
    flexDirection: "column",
  },

  profileImage: {
    width: "100%",
    height: 180,
    backgroundColor: "rgba(78, 205, 196, 0.1)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  profileImagePlaceholder: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4ECDC4",
    opacity: 0.5,
  },

  profileInfo: {
    marginBottom: 12,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  profileMeta: {
    marginTop: 8,
    gap: 6,
  },

  profileRole: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B0B0C0",
  },

  profileDistance: {
    fontSize: 12,
    fontWeight: "500",
    color: "#80B0C0",
  },

  profileLike: {
    fontSize: 20,
    textAlign: "right",
  },

  profileBio: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },

  bioTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  bioText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#B0B0C0",
    lineHeight: 20,
  },

  repliesHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFD700",
    textAlign: "center",
    marginVertical: 20,
    letterSpacing: 0.5,
  },

  repliesContainer: {
    gap: 12,
    marginBottom: 40,
  },

  replyOption: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#4ECDC4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  replyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
    lineHeight: 18,
  },

  replyEmoji: {
    fontSize: 16,
    marginLeft: 12,
  },

  /* Features */
  featuresScrollContent: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    zIndex: 10,
  },

  featuresTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 36,
    textAlign: "center",
  },

  featuresList: {
    gap: 20,
    marginBottom: 40,
  },

  featureItem: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },

  featureIcon: {
    fontSize: 32,
    marginTop: 4,
  },

  featureText: {
    flex: 1,
  },

  featureHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },

  featureDesc: {
    fontSize: 13,
    fontWeight: "400",
    color: "#B0B0C0",
  },

  /* Launch Splash */
  launchContent: {
    alignItems: "center",
    zIndex: 10,
  },

  launchText: {
    fontSize: 68,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1.5,
    marginBottom: 20,
  },

  launchTagline: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4ECDC4",
    letterSpacing: 0.5,
  },

  /* CTA */
  ctaScrollContent: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    zIndex: 10,
    alignItems: "center",
  },

  ctaHeader: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 32,
    textAlign: "center",
  },

  pricingCard: {
    backgroundColor: "rgba(78, 205, 196, 0.12)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4ECDC4",
    padding: 24,
    marginBottom: 24,
    width: "100%",
  },

  pricingRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(78, 205, 196, 0.2)",
  },

  pricingFeature: {
    fontSize: 15,
    fontWeight: "600",
    color: "#A0E7E0",
  },

  trialBanner: {
    marginTop: 16,
    alignItems: "center",
  },

  trialText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4ECDC4",
  },

  trialSmall: {
    fontSize: 12,
    fontWeight: "500",
    color: "#80B0C0",
    marginTop: 4,
  },

  ctaButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },

  nextButton: {
    position: "absolute",
    bottom: 32,
    left: 20,
    right: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },

  pricingFooter: {
    fontSize: 12,
    color: "#80B0C0",
    textAlign: "center",
  },

  /* Pagination */
  pagination: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
  },

  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },

  paginationDotActive: {
    backgroundColor: "#4ECDC4",
    width: 24,
  },
});

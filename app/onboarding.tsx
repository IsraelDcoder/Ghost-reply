import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import { Colors } from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: "0",
    type: "splash",
    gradient: ["#0B0B1A", "#0B0B1A", "#0B0B1A"] as const,
  },
  {
    id: "1",
    emoji: "👻",
    title: "Ghost Reply",
    subtitle:
      "Never overthink a text again. AI-powered replies for any conversation — from dating apps to professional messages.",
    gradient: ["#0A0A1A", "#0F0F2E", "#1A0A2E"] as const,
    accentColor: "#7B6CFF",
    context: "What is Ghost Reply?",
  },
  {
    id: "2",
    emoji: "📍",
    title: "The Problem",
    subtitle:
      "Struggling to respond? Worried your message won't land right? Spending too much time crafting the perfect reply?",
    gradient: ["#0A0A1A", "#1A0F2E", "#0F1A2E"] as const,
    accentColor: "#FF6B9D",
    context: "You're not alone",
    details: ["Blank screen anxiety", "Fear of saying the wrong thing", "Analysis paralysis"],
  },
  {
    id: "3",
    emoji: "⚡",
    title: "The Solution",
    subtitle:
      "Snap a screenshot or paste text. Our AI reads the context and generates replies that match your personality.",
    gradient: ["#0A0A1A", "#0F1A2E", "#1A0A2E"] as const,
    accentColor: "#4ECDC4",
    context: "How it works",
  },
  {
    id: "4",
    emoji: "🎯",
    title: "Choose Your Tone",
    subtitle:
      "Every reply can be perfectly calibrated. Want to be confident? Funny? Flirty? We've got the tone for you.",
    gradient: ["#0A0A1A", "#1A0A1A", "#2E0A1A"] as const,
    accentColor: "#FFD700",
    tones: ["😎 Confident", "😏 Flirty", "😂 Funny", "🔥 Savage", "🧠 Smart"],
  },
  {
    id: "5",
    emoji: "💡",
    title: "Where to Use It",
    subtitle:
      "Tinder, Bumble, Instagram DMs, WhatsApp, professional emails — any chat app where words matter.",
    gradient: ["#0A0A1A", "#0F1A2E", "#1A0F2E"] as const,
    accentColor: "#FF6B9D",
    useCases: ["Dating apps", "Text messages", "Professional replies", "Social media DMs"],
  },
  {
    id: "6",
    emoji: "🚀",
    title: "Ready to\ncraft better replies?",
    subtitle:
      "Get unlimited access to AI-powered replies that actually convert. Start free, upgrade anytime.",
    gradient: ["#1A0A2E", "#0F0F2E", "#0A0A1A"] as const,
    accentColor: "#7B6CFF",
    context: "Let's go",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setHasOnboarded } = useApp();
  const { shouldBypassPaywall } = useSubscription();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const navigateAfterOnboarding = async () => {
    await setHasOnboarded(true);
    
    // Check if user already has active subscription
    if (shouldBypassPaywall()) {
      console.log("[Onboarding] User has active subscription, skipping paywall");
      router.replace("/home");
    } else {
      console.log("[Onboarding] Directing user to paywall");
      router.replace("/paywall");
    }
  };

  const goNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Mark onboarding as complete and navigate
      await navigateAfterOnboarding();
    }
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <LinearGradient colors={currentSlide.gradient} style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        renderItem={({ item }: any) => {
          if (item.type === "splash") {
            return (
              <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: "#0B0B1A" }]}>
                <LinearGradient
                  colors={["rgba(236, 72, 153, 0.2)", "rgba(139, 92, 246, 0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientOverlay}
                />
                <View style={styles.splashContent}>
                  <Text style={styles.splashTitle}>GHOSTREPLY</Text>
                  <Text style={styles.splashSubtitle}>AI-Powered Replies</Text>
                </View>
              </View>
            );
          }
          return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View style={styles.slideContent}>
                {item.context && (
                  <Text style={styles.contextText}>{item.context}</Text>
                )}
                
                <View
                  style={[
                    styles.emojiContainer,
                    { backgroundColor: item.accentColor + "20", borderColor: item.accentColor + "40" },
                  ]}
                >
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>

                {item.details && (
                  <View style={styles.detailsContainer}>
                    {item.details.map((detail: string, i: number) => (
                      <View key={i} style={styles.detailRow}>
                        <Text style={[styles.detailBullet, { color: item.accentColor }]}>•</Text>
                        <Text style={styles.detailText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {item.tones && (
                  <View style={styles.tonesContainer}>
                    {item.tones.map((tone: string, i: number) => (
                      <View
                        key={i}
                        style={[styles.toneChip, { borderColor: item.accentColor + "60" }]}
                      >
                        <Text style={[styles.toneText, { color: item.accentColor }]}>
                          {tone}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {item.useCases && (
                  <View style={styles.useCasesContainer}>
                    {item.useCases.map((useCase: string, i: number) => (
                      <View key={i} style={styles.useCaseChip}>
                        <Text style={[styles.useCaseText, { color: item.accentColor }]}>
                          ✓ {useCase}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 24),
          },
        ]}
      >
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const width = scrollX.interpolate({
              inputRange,
              outputRange: [6, 24, 6],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width,
                    opacity,
                    backgroundColor: currentSlide.accentColor,
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.button, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["#7B6CFF", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
            </Text>
          </LinearGradient>
        </Pressable>

        {currentIndex < SLIDES.length - 1 && (
          <Pressable
            onPress={async () => {
              await navigateAfterOnboarding();
            }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  slideContent: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    textAlign: "center",
    lineHeight: 24,
  },
  tonesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  toneChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  toneText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    height: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  button: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#5A5A7A",
  },
  contextText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#7B7BA0",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  detailsContainer: {
    gap: 10,
    marginTop: 12,
    alignItems: "flex-start",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailBullet: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  detailText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#C4C4D6",
    flex: 1,
  },
  useCasesContainer: {
    gap: 10,
    marginTop: 12,
    width: "100%",
  },
  useCaseChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  useCaseText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
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
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
});

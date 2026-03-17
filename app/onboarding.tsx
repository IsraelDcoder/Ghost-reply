import React, { useRef, useState } from "react";
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
import { Colors } from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    emoji: "💬",
    title: "Never struggle with\nreplies again",
    subtitle:
      "Let AI craft the perfect message for any conversation. Upload a screenshot or paste text.",
    gradient: ["#0A0A1A", "#0F0F2E", "#1A0A2E"] as const,
    accentColor: "#7B6CFF",
  },
  {
    id: "2",
    emoji: "📸",
    title: "Screenshot or\npaste text",
    subtitle:
      "Upload your chat screenshot and our AI extracts the context to craft personalized replies.",
    gradient: ["#0A0A1A", "#0F1A2E", "#0A1A2E"] as const,
    accentColor: "#4ECDC4",
  },
  {
    id: "3",
    emoji: "🔥",
    title: "Win conversations\nwith confidence",
    subtitle:
      "Choose your tone — Confident, Flirty, Funny, Savage, or Smart. Always have the perfect comeback.",
    gradient: ["#0A0A1A", "#1A0A1A", "#2E0A1A"] as const,
    accentColor: "#FF6B9D",
    tones: ["😎 Confident", "😏 Flirty", "😂 Funny", "🔥 Savage", "🧠 Smart"],
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setHasOnboarded } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Mark onboarding as complete and wait for storage to persist
      await setHasOnboarded(true);
      // Use reset to prevent back navigation to onboarding
      router.replace("/paywall");
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
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.slideContent}>
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
            </View>
          </View>
        )}
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
              await setHasOnboarded(true);
              router.replace("/paywall");
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
});

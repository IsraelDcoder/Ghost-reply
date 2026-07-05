import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";

type Phase = "problem" | "pain" | "solution" | "demo" | "transformation" | "final";
type DemoStage = "incoming" | "thinking" | "reply-1" | "reply-2" | "reply-3";

type FadeInCardProps = {
  active: boolean;
  reducedMotion: boolean;
  children: React.ReactNode;
};

type DemoCardContentProps = {
  stage: DemoStage;
  reducedMotion: boolean;
};

type TransformationRevealProps = {
  showBefore: boolean;
  showAfter: boolean;
  reducedMotion: boolean;
};

function FadeInCard({ active, reducedMotion, children }: FadeInCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    const duration = reducedMotion ? 180 : 360;
    opacity.value = withTiming(active ? 1 : 0, { duration, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(active ? 0 : 18, { duration, easing: Easing.out(Easing.cubic) });
  }, [active, opacity, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

function DemoCardContent({ stage, reducedMotion }: DemoCardContentProps) {
  const glowOpacity = useSharedValue(0.2);
  const cardScale = useSharedValue(0.96);
  const replyOpacity = useSharedValue(0);

  useEffect(() => {
    const duration = reducedMotion ? 180 : 320;
    cardScale.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    glowOpacity.value = withTiming(stage === "incoming" ? 0.18 : 0.42, { duration, easing: Easing.out(Easing.cubic) });
    replyOpacity.value = withTiming(stage === "reply-1" || stage === "reply-2" || stage === "reply-3" ? 1 : 0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [cardScale, glowOpacity, replyOpacity, reducedMotion, stage]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const replyStyle = useAnimatedStyle(() => ({
    opacity: replyOpacity.value,
    transform: [{ translateY: 10 * (1 - replyOpacity.value) }],
  }));

  return (
    <Animated.View style={[styles.demoCard, cardStyle]}>
      <Animated.View style={[styles.demoGlow, glowStyle]} />
      <View style={styles.demoHeader}>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Ghost Reply</Text>
        </View>
        <View style={styles.typingDots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
      <View style={styles.demoBubble}>
        <Text style={styles.demoBubbleText}>{`Hey 😊\nAre you free tonight?`}</Text>
      </View>
      {stage === "thinking" ? (
        <View style={styles.thinkingRow}>
          <Text style={styles.thinkingText}>Thinking...</Text>
          <View style={styles.thinkingDots}>
            <View style={styles.thinkingDot} />
            <View style={styles.thinkingDot} />
            <View style={styles.thinkingDot} />
          </View>
        </View>
      ) : null}
      <Animated.View style={[styles.replyStack, replyStyle]}>
        {stage === "reply-1" ? (
          <View style={styles.replyChip}>
            <Text style={styles.replyLabel}>💜 Flirty</Text>
            <Text style={styles.replyText}>Only if you're asking me on a date 😉</Text>
          </View>
        ) : null}
        {stage === "reply-2" ? (
          <View style={styles.replyChip}>
            <Text style={styles.replyLabel}>💚 Funny</Text>
            <Text style={styles.replyText}>Free tonight... dangerous combo 😎</Text>
          </View>
        ) : null}
        {stage === "reply-3" ? (
          <View style={styles.replyChip}>
            <Text style={styles.replyLabel}>💙 Confident</Text>
            <Text style={styles.replyText}>Yes. What time?</Text>
          </View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

function TransformationReveal({ showBefore, showAfter, reducedMotion }: TransformationRevealProps) {
  const beforeOpacity = useSharedValue(0.35);
  const afterOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(0.98);

  useEffect(() => {
    const duration = reducedMotion ? 220 : 360;
    beforeOpacity.value = withTiming(showBefore ? 1 : 0.35, { duration, easing: Easing.out(Easing.cubic) });
    afterOpacity.value = withTiming(showAfter ? 1 : 0, { duration, easing: Easing.out(Easing.cubic) });
    pulseScale.value = withTiming(showAfter ? 1 : 0.98, { duration, easing: Easing.out(Easing.cubic) });
  }, [afterOpacity, beforeOpacity, pulseScale, reducedMotion, showAfter, showBefore]);

  const beforeStyle = useAnimatedStyle(() => ({
    opacity: beforeOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const afterStyle = useAnimatedStyle(() => ({
    opacity: afterOpacity.value,
    transform: [{ translateY: 10 * (1 - afterOpacity.value) }],
  }));

  return (
    <View style={styles.transformationCard}>
      <Animated.View style={[styles.transformationColumn, styles.transformationColumnBefore, beforeStyle]}>
        <Text style={styles.transformationLabel}>Before</Text>
        <Text style={styles.transformationText}>“I don’t know...”</Text>
      </Animated.View>
      {showBefore ? (
        <View style={styles.transformationDivider}>
          <Text style={styles.transformationArrow}>→</Text>
        </View>
      ) : null}
      <Animated.View style={[styles.transformationColumn, styles.transformationColumnAfter, afterStyle]}>
        <Text style={styles.transformationLabel}>After</Text>
        <Text style={styles.transformationText}>“Sounds good 😊 Can’t wait.”</Text>
      </Animated.View>
      {showAfter ? (
        <View style={styles.transformationBadge}>
          <Text style={styles.transformationBadgeText}>Confidence unlocked</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setHasOnboarded } = useApp();
  const { shouldBypassPaywall } = useSubscription();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState<Phase>("problem");
  const [problemWords, setProblemWords] = useState<string[]>([]);
  const [problemLineVisible, setProblemLineVisible] = useState(false);
  const [painText, setPainText] = useState("");
  const [painStage, setPainStage] = useState<"typing-1" | "deleting-1" | "typing-2" | "deleting-2" | "typing-3" | "deleting-3" | "done">("typing-1");
  const [solutionLine, setSolutionLine] = useState(0);
  const [demoStage, setDemoStage] = useState<DemoStage>("incoming");
  const [showBefore, setShowBefore] = useState(false);
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (isMounted) setReducedMotion(value);
    });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      if (isMounted) setReducedMotion(value);
    });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (phase !== "problem") return;

    let cancelled = false;
    const words = ["Never", "Get", "Ghosted", "Again."];
    setProblemWords([]);
    setProblemLineVisible(false);

    let index = 0;
    const step = () => {
      if (cancelled) return;
      if (index >= words.length) {
        setProblemLineVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const delay = reducedMotion ? 700 : 1200;
        const timer = setTimeout(() => {
          if (!cancelled) setPhase("pain");
        }, delay);
        return () => clearTimeout(timer);
      }

      setProblemWords((prev) => [...prev, words[index]]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      index += 1;
      const timeout = setTimeout(step, reducedMotion ? 160 : 240);
      return () => clearTimeout(timeout);
    };

    const timeout = setTimeout(step, reducedMotion ? 160 : 220);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "pain") return;

    let cancelled = false;
    const timeoutRef: Array<ReturnType<typeof setTimeout>> = [];

    const clearTimers = () => {
      timeoutRef.forEach((timer) => clearTimeout(timer));
    };

    const schedule = (callback: () => void, ms: number) => {
      const timer = setTimeout(() => {
        if (!cancelled) callback();
      }, ms);
      timeoutRef.push(timer);
    };

    const runStage = () => {
      if (cancelled) return;
      switch (painStage) {
        case "typing-1": {
          setPainText("I really li...");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          schedule(() => setPainStage("deleting-1"), reducedMotion ? 700 : 1000);
          break;
        }
        case "deleting-1": {
          setPainText("");
          schedule(() => setPainStage("typing-2"), reducedMotion ? 220 : 360);
          break;
        }
        case "typing-2": {
          setPainText("I had fu...");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          schedule(() => setPainStage("deleting-2"), reducedMotion ? 700 : 1000);
          break;
        }
        case "deleting-2": {
          setPainText("");
          schedule(() => setPainStage("typing-3"), reducedMotion ? 220 : 360);
          break;
        }
        case "typing-3": {
          setPainText("Thanks...");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          schedule(() => setPainStage("deleting-3"), reducedMotion ? 700 : 1000);
          break;
        }
        case "deleting-3": {
          setPainText("");
          schedule(() => {
            setPainStage("done");
            setPhase("solution");
          }, reducedMotion ? 400 : 800);
          break;
        }
        default:
          break;
      }
    };

    runStage();
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [painStage, phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "solution") return;
    let cancelled = false;
    const labels = ["Meet...", "Ghost Reply.", "AI replies\nthat sound\nlike YOU."];

    setSolutionLine(0);
    const step = () => {
      if (cancelled) return;
      if (solutionLine >= labels.length - 1) {
        const timeout = setTimeout(() => {
          if (!cancelled) setPhase("demo");
        }, reducedMotion ? 900 : 1400);
        return () => clearTimeout(timeout);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSolutionLine((value) => value + 1);
      const timeout = setTimeout(step, reducedMotion ? 700 : 1000);
      return () => clearTimeout(timeout);
    };

    const timeout = setTimeout(step, reducedMotion ? 450 : 700);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [phase, reducedMotion, solutionLine]);

  useEffect(() => {
    if (phase !== "demo") return;

    let cancelled = false;
    const advance = () => {
      if (cancelled) return;
      switch (demoStage) {
        case "incoming":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setDemoStage("thinking");
          break;
        case "thinking":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setDemoStage("reply-1");
          break;
        case "reply-1":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setDemoStage("reply-2");
          break;
        case "reply-2":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setDemoStage("reply-3");
          break;
        case "reply-3":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setPhase("transformation");
          break;
        default:
          break;
      }
    };

    const timer = setTimeout(advance, reducedMotion ? 600 : 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [demoStage, phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "transformation") return;

    let cancelled = false;
    const first = setTimeout(() => {
      if (!cancelled) {
        setShowBefore(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, reducedMotion ? 250 : 500);

    const second = setTimeout(() => {
      if (!cancelled) {
        setShowAfter(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, reducedMotion ? 900 : 1300);

    const third = setTimeout(() => {
      if (!cancelled) setPhase("final");
    }, reducedMotion ? 1800 : 2400);

    return () => {
      cancelled = true;
      clearTimeout(first);
      clearTimeout(second);
      clearTimeout(third);
    };
  }, [phase, reducedMotion]);

  const handleGetStarted = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setHasOnboarded(true);
    if (shouldBypassPaywall()) {
      router.replace("/home");
    } else {
      router.replace("/paywall");
    }
  };

  const phaseBackgrounds: Record<Phase, [string, string, string]> = {
    problem: ["#04050A", "#090B16", "#120C24"],
    pain: ["#06070D", "#111327", "#19133B"],
    solution: ["#06060F", "#100D24", "#17113B"],
    demo: ["#06070E", "#12142C", "#17143C"],
    transformation: ["#05060D", "#0C1030", "#140E2D"],
    final: ["#0A0A20", "#16133A", "#221765"],
  };

  const renderContent = () => {
    switch (phase) {
      case "problem":
        return (
          <FadeInCard active reducedMotion={reducedMotion}>
            <View style={styles.centeredContent}>
              <Text style={styles.sceneEyebrow}>The problem</Text>
              <View style={styles.problemWordStack}>
                {problemWords.map((word, index) => (
                  <Text key={`${word}-${index}`} style={styles.problemWord}>
                    {word}
                  </Text>
                ))}
              </View>
              {problemLineVisible ? <Text style={styles.problemLine}>The right reply changes everything.</Text> : null}
            </View>
          </FadeInCard>
        );
      case "pain":
        return (
          <FadeInCard active reducedMotion={reducedMotion}>
            <View style={styles.centeredContent}>
              <Text style={styles.sceneEyebrow}>The pain</Text>
              <View style={styles.typingCard}>
                <View style={styles.typingHeader}>
                  <View style={styles.typingDots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>
                <Text style={styles.typingText}>{painText}</Text>
                <View style={styles.cursor} />
              </View>
            </View>
          </FadeInCard>
        );
      case "solution":
        return (
          <FadeInCard active reducedMotion={reducedMotion}>
            <View style={styles.centeredContent}>
              <View style={styles.logoGlow}>
                <Text style={styles.logoText}>GhostReply</Text>
              </View>
              <Text style={styles.solutionTitle}>
                {solutionLine >= 0 ? "Meet..." : ""}
              </Text>
              <Text style={styles.solutionTitle}>{solutionLine >= 1 ? "Ghost Reply." : ""}</Text>
              <Text style={styles.solutionSubtitle}>{solutionLine >= 2 ? "AI replies that sound like you." : ""}</Text>
              <Text style={styles.solutionSubtitle}>{solutionLine >= 2 ? "Not like a robot." : ""}</Text>
            </View>
          </FadeInCard>
        );
      case "demo":
        return (
          <FadeInCard active reducedMotion={reducedMotion}>
            <View style={styles.centeredContent}>
              <Text style={styles.sceneEyebrow}>The product</Text>
              <DemoCardContent stage={demoStage} reducedMotion={reducedMotion} />
            </View>
          </FadeInCard>
        );
      case "transformation":
        return (
          <FadeInCard active reducedMotion={reducedMotion}>
            <View style={styles.centeredContent}>
              <Text style={styles.sceneEyebrow}>The transformation</Text>
              <TransformationReveal showBefore={showBefore} showAfter={showAfter} reducedMotion={reducedMotion} />
            </View>
          </FadeInCard>
        );
      case "final":
        return (
          <FadeInCard active reducedMotion={reducedMotion}>
            <View style={styles.centeredContent}>
              <Text style={styles.sceneEyebrow}>Ready?</Text>
              <Text style={styles.finalTitle}>Ready to never overthink a text again?</Text>
              <Text style={styles.finalSubtitle}>
                Join thousands of people using Ghost Reply to write better replies in seconds.
              </Text>
              <Pressable onPress={handleGetStarted} style={styles.ctaButton}>
                <LinearGradient colors={["#8B76FF", "#A855F7"]} style={styles.ctaGradient}>
                  <Text style={styles.ctaText}>Get Started</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </FadeInCard>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={phaseBackgrounds[phase]} style={styles.fullScreen}>
        {renderContent()}
      </LinearGradient>

      {phase !== "final" ? (
        <Pressable
          style={[styles.skipButton, { top: Platform.OS === "web" ? 32 : Math.max(insets.top, 24) }]}
          onPress={() => setPhase("final")}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040A",
  },
  fullScreen: {
    flex: 1,
    width: "100%",
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
  },
  sceneEyebrow: {
    color: "#A79DFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  problemWordStack: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  problemWord: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.3,
  },
  problemLine: {
    marginTop: 20,
    color: "#D6D4EB",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 26,
  },
  typingCard: {
    width: "100%",
    maxWidth: 360,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  typingHeader: {
    marginBottom: 12,
  },
  typingDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  typingText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 28,
    minHeight: 84,
  },
  cursor: {
    width: 10,
    height: 22,
    backgroundColor: "#A179FF",
    marginTop: 8,
  },
  logoGlow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "rgba(161,121,255,0.16)",
    marginBottom: 20,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  solutionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  solutionSubtitle: {
    color: "#D1CDEB",
    fontSize: 16,
    textAlign: "center",
  },
  demoCard: {
    width: "100%",
    maxWidth: 360,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    shadowColor: "#8B76FF",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  demoGlow: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(139, 118, 255, 0.16)",
  },
  demoHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  demoBadge: {
    backgroundColor: "rgba(139, 118, 255, 0.16)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  demoBubble: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  demoBubbleText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
  },
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  thinkingText: {
    color: "#D1CDEB",
    fontSize: 13,
  },
  thinkingDots: {
    flexDirection: "row",
    gap: 4,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A179FF",
  },
  replyStack: {
    marginTop: 2,
  },
  replyChip: {
    backgroundColor: "rgba(161,121,255,0.16)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  replyLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  replyText: {
    color: "#DDD8F7",
    fontSize: 12,
  },
  transformationCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  transformationColumn: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  transformationColumnBefore: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  transformationColumnAfter: {
    backgroundColor: "rgba(139, 118, 255, 0.16)",
    borderColor: "rgba(177, 157, 255, 0.22)",
    marginTop: 10,
  },
  transformationDivider: {
    marginVertical: 6,
  },
  transformationArrow: {
    color: "#A79DFF",
    fontSize: 22,
    fontWeight: "700",
  },
  transformationLabel: {
    color: "#A79DFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  transformationText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  transformationBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  transformationBadgeText: {
    color: "#F7F4FF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  finalTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 12,
  },
  finalSubtitle: {
    color: "#E2DDF8",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 24,
  },
  ctaButton: {
    width: "100%",
    maxWidth: 260,
    borderRadius: 999,
    overflow: "hidden",
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  skipButton: {
    position: "absolute",
    right: 18,
    zIndex: 10,
  },
  skipText: {
    color: "#AFAED8",
    fontSize: 15,
    fontWeight: "600",
  },
});

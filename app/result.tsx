import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { captureRef } from "react-native-view-shot";
import { ChatScreenshot } from "@/components/ChatScreenshot";
import {
  shareScreenshotToSocial,
  generateShareCaption,
  generateReferralLink,
} from "@/lib/screenshot-sharing";
import { apiRequest } from "@/lib/query-client";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

interface AIResult {
  analysis: string;
  score: number;
  scoreLabel: string;
  scoreAdvice: string;
  replies: {
    confident: string;
    flirty: string;
    funny: string;
    savage: string;
    smart: string;
  };
}

interface Personality {
  key: keyof AIResult["replies"];
  label: string;
  emoji: string;
  color: string;
  gradientColors: [string, string];
  description: string;
}

const PERSONALITIES: Personality[] = [
  {
    key: "confident",
    label: "Confident",
    emoji: "😎",
    color: "#FF8C42",
    gradientColors: ["#FF8C4220", "#FF8C4208"],
    description: "Bold & direct",
  },
  {
    key: "flirty",
    label: "Flirty",
    emoji: "😏",
    color: "#FF6B9D",
    gradientColors: ["#FF6B9D20", "#FF6B9D08"],
    description: "Charming & playful",
  },
  {
    key: "funny",
    label: "Funny",
    emoji: "😂",
    color: "#4ECDC4",
    gradientColors: ["#4ECDC420", "#4ECDC408"],
    description: "Witty & clever",
  },
  {
    key: "savage",
    label: "Savage",
    emoji: "🔥",
    color: "#FF4757",
    gradientColors: ["#FF475720", "#FF475708"],
    description: "Sharp & cutting",
  },
  {
    key: "smart",
    label: "Smart",
    emoji: "🧠",
    color: "#7B6CFF",
    gradientColors: ["#7B6CFF20", "#7B6CFF08"],
    description: "Thoughtful & deep",
  },
];

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { deviceId } = useApp();
  const [result, setResult] = useState<AIResult>(() => {
    try {
      return JSON.parse(params.data as string);
    } catch {
      return null;
    }
  });
  const inputText = params.inputText as string;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const [sharingKey, setSharingKey] = useState<string | null>(null);
  const screenshotRefs = useRef<{ [key: string]: View }>({}); // Refs for each personality screenshot

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  if (!result) {
    return (
      <LinearGradient colors={["#0A0A1A", "#0F0F2E"]} style={styles.container}>
        <View style={[styles.errorContainer, { paddingTop: topPad }]}>
          <Ionicons name="alert-circle" size={48} color="#FF4757" />
          <Text style={styles.errorText}>Failed to load results</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const handleCopy = async (key: string, text: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegenerate = async (personality: Personality) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRegeneratingKey(personality.key);

    try {
      const res = await apiRequest("POST", "/api/regenerate", {
        text: inputText,
        personality: personality.key,
      });
      const data = await res.json();

      setResult((prev) => ({
        ...prev!,
        replies: {
          ...prev!.replies,
          [personality.key]: data.reply,
        },
      }));
    } catch {
      Alert.alert("Error", "Failed to regenerate. Try again.");
    } finally {
      setRegeneratingKey(null);
    }
  };

  const handleShare = async (personality: Personality) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const reply = result.replies[personality.key];

    // Show options for sharing
    Alert.alert(
      "Share Reply",
      "Choose how you want to share this reply",
      [
        {
          text: "Share Screenshot",
          onPress: () => captureAndShareScreenshot(personality, reply),
        },
        {
          text: "Copy Text",
          onPress: () => handleCopy("share", reply),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const captureAndShareScreenshot = async (
    personality: Personality,
    reply: string
  ) => {
    setSharingKey(personality.key);
    try {
      // Get the ref for this personality's screenshot
      const ref = screenshotRefs.current[personality.key];
      if (!ref) {
        throw new Error("Screenshot ref not found");
      }

      // Capture the view as an image
      let uri = await captureRef(ref, {
        format: "png",
        quality: 0.9,
        result: "tmpfile",
      });

      if (!uri) {
        throw new Error("Failed to capture screenshot");
      }

      // Generate caption for social media
      const caption = generateShareCaption(personality.label, personality.emoji);

      // Show platform selection
      Alert.alert(
        "Share To",
        "Where would you like to share this?",
        [
          {
            text: "TikTok",
            onPress: () => shareAndTrack(uri, "tiktok", caption),
          },
          {
            text: "Instagram",
            onPress: () => shareAndTrack(uri, "instagram", caption),
          },
          {
            text: "Other Apps",
            onPress: () => shareAndTrack(uri, "generic", caption),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to generate screenshot: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setSharingKey(null);
    }
  };

  const shareAndTrack = async (
    imageUri: string,
    platform: "tiktok" | "instagram" | "generic",
    caption: string
  ) => {
    try {
      await shareScreenshotToSocial(imageUri, platform, caption);
      // Track the share event
      await trackShareEvent(platform);
      Alert.alert("Success", "Share dialog opened. Happy sharing!");
    } catch (error) {
      Alert.alert(
        "Share Failed",
        `Could not share to ${platform}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const trackShareEvent = async (platform: string) => {
    try {
      // Track analytics (when implemented)
      console.log(`Share event: ${platform}`);
    } catch (error) {
      console.error("Failed to track share event:", error);
    }
  };

  const scoreColor = result.score >= 80 ? "#4CAF7D" : result.score >= 60 ? "#FF8C42" : "#FF4757";

  return (
    <LinearGradient colors={["#0A0A1A", "#0F0F2E"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 20 },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Your Replies</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.insightCard}>
          <LinearGradient
            colors={["#1A1A35", "#12122A"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <View style={styles.insightHeader}>
            <View style={styles.insightIconRow}>
              <LinearGradient
                colors={["#7B6CFF", "#A855F7"]}
                style={styles.insightIcon}
              >
                <Ionicons name="eye" size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.insightLabel}>Conversation Insight</Text>
            </View>
          </View>
          <Text style={styles.insightText}>{result.analysis}</Text>
        </View>

        <View style={styles.scoreCard}>
          <LinearGradient
            colors={["#1A1A35", "#12122A"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreTitle}>Conversation Score</Text>
            <Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
            <Text style={styles.scoreAdvice}>{result.scoreAdvice}</Text>
          </View>
          <View style={styles.scoreCircle}>
            <ScoreRing score={result.score} color={scoreColor} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose Your Reply</Text>

        {PERSONALITIES.map((personality) => {
          const reply = result.replies[personality.key];
          const isCopied = copiedKey === personality.key;
          const isRegenerating = regeneratingKey === personality.key;

          return (
            <PersonalityCard
              key={personality.key}
              personality={personality}
              reply={reply}
              isCopied={isCopied}
              isRegenerating={isRegenerating}
              onCopy={() => handleCopy(personality.key, reply)}
              onRegenerate={() => handleRegenerate(personality)}
              onShare={() => handleShare(personality)}
              inputText={inputText}
              onScreenshotRefReady={(key, ref) => {
                screenshotRefs.current[key] = ref;
              }}
            />
          );
        })}

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.newAnalysisButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="add" size={18} color="#7B6CFF" />
          <Text style={styles.newAnalysisText}>Analyze Another Conversation</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: score,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [score]);

  return (
    <View style={styles.scoreRingContainer}>
      <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
      <Text style={styles.scoreMax}>/100</Text>
    </View>
  );
}

function PersonalityCard({
  personality,
  reply,
  isCopied,
  isRegenerating,
  onCopy,
  onRegenerate,
  onShare,
  inputText,
  onScreenshotRefReady,
}: {
  personality: Personality;
  reply: string;
  isCopied: boolean;
  isRegenerating: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onShare: () => void;
  inputText: string;
  onScreenshotRefReady: (key: string, ref: View) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 200,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 20,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.personalityCard}
      >
        <LinearGradient
          colors={personality.gradientColors}
          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
        />
        <View style={[styles.cardBorderAccent, { backgroundColor: personality.color }]} />

        <View style={styles.personalityHeader}>
          <View style={styles.personalityLabelRow}>
            <Text style={styles.personalityEmoji}>{personality.emoji}</Text>
            <View>
              <Text style={[styles.personalityLabel, { color: personality.color }]}>
                {personality.label.toUpperCase()}
              </Text>
              <Text style={styles.personalityDescription}>{personality.description}</Text>
            </View>
          </View>
        </View>

        {isRegenerating ? (
          <View style={styles.replyLoadingContainer}>
            <ActivityIndicator color={personality.color} size="small" />
            <Text style={[styles.replyLoadingText, { color: personality.color }]}>
              Regenerating...
            </Text>
          </View>
        ) : (
          <Text style={styles.replyText}>"{reply}"</Text>
        )}

        <View style={styles.actionRow}>
          <Pressable
            onPress={onCopy}
            style={[styles.actionButton, isCopied && styles.actionButtonActive]}
          >
            <Ionicons
              name={isCopied ? "checkmark" : "copy-outline"}
              size={16}
              color={isCopied ? "#4CAF7D" : "#9B9BBF"}
            />
            <Text style={[styles.actionButtonText, isCopied && { color: "#4CAF7D" }]}>
              {isCopied ? "Copied!" : "Copy"}
            </Text>
          </Pressable>

          <Pressable onPress={onRegenerate} style={styles.actionButton} disabled={isRegenerating}>
            <Ionicons name="refresh" size={16} color="#9B9BBF" />
            <Text style={styles.actionButtonText}>Regenerate</Text>
          </Pressable>

          <Pressable onPress={onShare} style={styles.actionButton}>
            <Ionicons name="share-outline" size={16} color="#9B9BBF" />
            <Text style={styles.actionButtonText}>Share</Text>
          </Pressable>
        </View>

        {/* Hidden screenshot for capturing */}
        <View
          style={styles.hiddenScreenshot}
          ref={(ref: any) => {
            if (ref && onScreenshotRefReady) {
              onScreenshotRefReady(personality.key, ref);
            }
          }}
        >
          <ChatScreenshot
            inputText={inputText}
            reply={reply}
            personalityLabel={personality.label}
            personalityEmoji={personality.emoji}
            personalityColor={personality.color}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: 14,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A35",
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  insightCard: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#252545",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  insightIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  insightLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#9B9BBF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  insightText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  scoreCard: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#252545",
    gap: 16,
  },
  scoreLeft: {
    flex: 1,
    gap: 6,
  },
  scoreTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#9B9BBF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  scoreLabel: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  scoreAdvice: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    lineHeight: 18,
  },
  scoreCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRingContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#252545",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNumber: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
  },
  scoreMax: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#5A5A7A",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  personalityCard: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "#252545",
    position: "relative",
  },
  cardBorderAccent: {
    position: "absolute",
    left: 0,
    top: 20,
    bottom: 20,
    width: 3,
    borderRadius: 2,
  },
  personalityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  personalityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  personalityEmoji: {
    fontSize: 28,
  },
  personalityLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  personalityDescription: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A5A7A",
    marginTop: 1,
  },
  replyText: {
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  replyLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  replyLoadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF10",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF08",
  },
  actionButtonActive: {
    backgroundColor: "#4CAF7D15",
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#9B9BBF",
  },
  newAnalysisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#7B6CFF40",
    backgroundColor: "#7B6CFF10",
    marginTop: 4,
  },
  newAnalysisText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#7B6CFF",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  backBtn: {
    backgroundColor: "#1A1A35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
  },
  hiddenScreenshot: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
    left: -9999,
    top: -9999,
  },
});

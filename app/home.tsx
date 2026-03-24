import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import { apiRequest } from "@/lib/query-client";
import { Colors } from "@/constants/colors";
import {
  extractTextFromImage,
  validateChatText,
  formatOCRForAnalysis,
} from "@/lib/ocr";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { incrementReplyCount } = useApp();
  const { subscriptionStatus, dailyLimit, loading, canAnalyzeConversation, refreshSubscriptionStatus } = useSubscription();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"paste" | "screenshot" | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  // Check if user can analyze based on subscription context (trial/paid) and backend daily limit
  const canAnalyze = subscriptionStatus?.isSubscribed ? true : ((dailyLimit?.remaining ?? 0) > 0);
  // Use backend's daily limit, not local storage
  const remainingReplies = subscriptionStatus?.isSubscribed ? Infinity : (dailyLimit?.remaining ?? 0);

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!canAnalyze) {
      showLimitAlert();
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setIsExtracting(true);
      setMode("screenshot");

      try {
        // Extract text from screenshot
        const ocrResult = await extractTextFromImage(imageUri);

        if (!ocrResult.success) {
          setIsExtracting(false);
          Alert.alert(
            "OCR Failed",
            ocrResult.error || "Could not extract text from image. Please try another image."
          );
          return;
        }

        // Validate that it looks like a chat
        const validation = validateChatText(ocrResult.text);
        if (!validation.isValid) {
          setIsExtracting(false);
          Alert.alert(
            "Not a chat screenshot",
            validation.reason ||
              "The extracted text doesn't look like a conversation. Please upload a chat screenshot.",
            [
              {
                text: "Try another image",
                onPress: () => handlePickImage(),
              },
              {
                text: "Use as is",
                onPress: () =>
                  analyzeText(formatOCRForAnalysis(ocrResult.text, ocrResult.confidence)),
              },
            ]
          );
          return;
        }

        // Format and analyze
        setIsExtracting(false);
        const formattedText = formatOCRForAnalysis(ocrResult.text, ocrResult.confidence);
        await analyzeText(formattedText);
      } catch (error) {
        setIsExtracting(false);
        console.error("Image processing error:", error);
        Alert.alert(
          "Error",
          `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  };

  const handleAnalyzeText = async () => {
    if (!text.trim()) {
      Alert.alert("Empty input", "Please paste or type a conversation to analyze.");
      return;
    }

    if (!canAnalyze) {
      showLimitAlert();
      return;
    }

    await analyzeText(text);
  };

  const showLimitAlert = () => {
    Alert.alert(
      "Daily limit reached",
      "You've used your 2 free replies today. Upgrade to Pro for unlimited replies.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Upgrade", onPress: () => router.push("/paywall") },
      ]
    );
  };

  const analyzeText = async (inputText: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);

    try {
      const res = await apiRequest("POST", "/api/analyze", { text: inputText });
      const data = await res.json();

      await incrementReplyCount();
      // Refresh subscription status to update daily limit display
      await refreshSubscriptionStatus();

      router.push({
        pathname: "/result",
        params: {
          data: JSON.stringify(data),
          inputText: inputText,
        },
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      Alert.alert("Error", "Failed to analyze conversation. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePickupLines = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await analyzeText(
      "I want some creative pickup lines. Make them clever, funny, and charming. Not too cheesy."
    );
  };

  // Loading guard: Don't render UI until subscription data is loaded
  if (loading) {
    return (
      <LinearGradient colors={["#0A0A1A", "#0F0F2E"]} style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#7B6CFF" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A0A1A", "#0F0F2E"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.menuButton}
              onPress={() => {
                Alert.alert("GhostReply", "Support: support@ghostreply.app\n\nVersion 1.0.0");
              }}
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.logoRow}>
            <Text style={styles.ghostLogo}>👻</Text>
            <Text style={styles.logoText}>GhostReply</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable 
              style={styles.menuButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/history");
              }}
            >
              <Ionicons name="time-outline" size={24} color="#9B9BBF" />
            </Pressable>
          </View>
        </View>

        {!subscriptionStatus?.isSubscribed && (
          <Pressable
            onPress={() => router.push("/paywall")}
            style={styles.freeBanner}
          >
            <LinearGradient
              colors={["#7B6CFF20", "#A855F710"]}
              style={styles.freeBannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="flash" size={14} color="#7B6CFF" />
              <Text style={styles.freeBannerText}>
                {remainingReplies > 0
                  ? `${remainingReplies} free ${remainingReplies === 1 ? "reply" : "replies"} remaining today`
                  : "Daily limit reached — Upgrade for unlimited"}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#7B6CFF" />
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>What's the situation?</Text>
          <Text style={styles.heroSubtitle}>Upload a screenshot or paste the conversation</Text>
        </View>

        <View style={styles.primaryActionsGrid}>
          <Pressable
            onPress={handlePickImage}
            disabled={isExtracting || isAnalyzing}
            style={({ pressed }) => [
              styles.primaryCard,
              styles.screenshotCard,
              (isExtracting || isAnalyzing) && { opacity: 0.5 },
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={["#1A1A35", "#252550"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
            <LinearGradient
              colors={["#7B6CFF", "#A855F7"]}
              style={styles.actionIconBg}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.cardTitle}>Upload Screenshot</Text>
            <Text style={styles.cardSubtitle}>AI extracts & analyzes your chat</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>OCR</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setMode(mode === "paste" ? null : "paste")}
            disabled={isExtracting || isAnalyzing}
            style={({ pressed }) => [
              styles.primaryCard,
              styles.pasteCard,
              mode === "paste" && styles.pasteCardActive,
              (isExtracting || isAnalyzing) && { opacity: 0.5 },
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={["#1A1A35", "#252550"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
            <LinearGradient
              colors={["#4ECDC4", "#2EA89F"]}
              style={styles.actionIconBg}
            >
              <Ionicons name="clipboard" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.cardTitle}>Paste Text</Text>
            <Text style={styles.cardSubtitle}>Type or paste any conversation</Text>
          </Pressable>
        </View>

        {mode === "paste" && (
          <View style={styles.textInputCard}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Paste the conversation here...&#10;&#10;Example:&#10;Her: I guess you're interesting after all 😏&#10;You: ..."
              placeholderTextColor="#5A5A7A"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus
            />
            <Pressable
              onPress={handleAnalyzeText}
              disabled={isAnalyzing || !text.trim()}
              style={({ pressed }) => [
                styles.analyzeButton,
                { opacity: pressed || !text.trim() ? 0.6 : 1 },
              ]}
            >
              <LinearGradient
                colors={isAnalyzing ? ["#3A3A6A", "#3A3A6A"] : ["#7B6CFF", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.analyzeGradient}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.analyzeText}>Analyze</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {isExtracting && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#7B6CFF" size="large" />
            <Text style={styles.loadingText}>Extracting text...</Text>
            <Text style={styles.loadingSubtext}>Processing your screenshot</Text>
          </View>
        )}

        {isAnalyzing && mode !== "paste" && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#7B6CFF" size="large" />
            <Text style={styles.loadingText}>AI is analyzing...</Text>
            <Text style={styles.loadingSubtext}>Generating perfect replies for you</Text>
          </View>
        )}

        <Pressable
          onPress={handlePickupLines}
          disabled={isExtracting || isAnalyzing}
          style={({ pressed }) => [
            styles.pickupCard,
            (isExtracting || isAnalyzing) && { opacity: 0.5 },
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={["#FF6B9D20", "#FF475710"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <View style={styles.pickupLeft}>
            <Text style={styles.pickupEmoji}>💘</Text>
            <View>
              <Text style={styles.pickupTitle}>Get Pickup Lines</Text>
              <Text style={styles.pickupSubtitle}>AI-crafted openers that work</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FF6B9D" />
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Personalities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>AI</Text>
            <Text style={styles.statLabel}>Powered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>100</Text>
            <Text style={styles.statLabel}>Max Score</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    width: 44,
  },
  headerRight: {
    width: 44,
    alignItems: "flex-end",
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A35",
    borderRadius: 14,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ghostLogo: {
    fontSize: 22,
  },
  logoText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  freeBanner: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#7B6CFF40",
  },
  freeBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  freeBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#9B9BBF",
  },
  heroSection: {
    paddingTop: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    marginTop: 4,
  },
  primaryActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  primaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#252545",
    overflow: "hidden",
    gap: 10,
    minHeight: 160,
    justifyContent: "space-between",
  },
  screenshotCard: {},
  pasteCard: {},
  pasteCardActive: {
    borderColor: "#4ECDC4",
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    lineHeight: 16,
  },
  cardBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#7B6CFF20",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cardBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#7B6CFF",
    letterSpacing: 0.5,
  },
  textInputCard: {
    backgroundColor: "#1A1A35",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4ECDC460",
    overflow: "hidden",
  },
  textInput: {
    padding: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    minHeight: 140,
    lineHeight: 22,
  },
  analyzeButton: {
    margin: 12,
    marginTop: 0,
    borderRadius: 14,
    overflow: "hidden",
  },
  analyzeGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  analyzeText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  loadingCard: {
    backgroundColor: "#1A1A35",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#252545",
  },
  loadingText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
  },
  pickupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF6B9D30",
    overflow: "hidden",
  },
  pickupLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pickupEmoji: {
    fontSize: 32,
  },
  pickupTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  pickupSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#1A1A35",
    borderRadius: 20,
    padding: 20,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#252545",
  },
  statCard: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#7B6CFF",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#9B9BBF",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#252545",
  },
});

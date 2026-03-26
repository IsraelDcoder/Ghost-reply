import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useApp } from "@/context/AppContext";

interface Conversation {
  id: string;
  inputText: string;
  analysis: string;
  score: number;
  scoreLabel: string;
  replies: {
    confident: string;
    flirty: string;
    funny: string;
    savage: string;
    smart: string;
  };
  createdAt: string;
}

const PERSONALITY_COLORS: Record<string, string> = {
  confident: "#FF8C42",
  flirty: "#FF6B9D",
  funny: "#4ECDC4",
  savage: "#FF4757",
  smart: "#7B6CFF",
};

const PERSONALITY_EMOJIS: Record<string, string> = {
  confident: "😎",
  flirty: "😏",
  funny: "😂",
  savage: "🔥",
  smart: "🧠",
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { deviceId } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch conversations
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["conversations", deviceId],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/conversations");
      const json = await res.json();
      return json.conversations || [];
    },
    enabled: !!deviceId,
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleConversationPress = async (conversation: Conversation) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/result",
      params: {
        data: JSON.stringify({
          analysis: conversation.analysis,
          score: conversation.score,
          scoreLabel: conversation.scoreLabel,
          scoreAdvice: "This was from your history",
          replies: conversation.replies,
        }),
        inputText: conversation.inputText,
        fromHistory: "true",
      },
    });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Note: You may want to add a DELETE /api/conversations/:id endpoint
    console.log("Delete conversation:", conversationId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const truncateText = (text: string, len: number = 50): string => {
    return text.length > len ? text.substring(0, len) + "..." : text;
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#0A0A1A", "#0F0F2E"]} style={styles.container}>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#7B6CFF" />
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#0A0A1A", "#0F0F2E"]} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.title}>History</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B9D40" />
          <Text style={styles.emptyText}>Failed to load history</Text>
          <Text style={styles.emptySubtext}>Please check your connection and try again</Text>
          <Pressable onPress={() => refetch()} style={styles.createBtn}>
            <LinearGradient
              colors={["#7B6CFF", "#5A4DBF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <Text style={styles.createBtnText}>Retry</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const conversations = (data || []) as Conversation[];

  return (
    <LinearGradient colors={["#0A0A1A", "#0F0F2E"]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Empty State */}
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="hourglass-outline" size={64} color="#7B6CFF40" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Your conversation history will appear here
          </Text>
          <Pressable onPress={() => router.push("/home")} style={styles.createBtn}>
            <LinearGradient
              colors={["#7B6CFF", "#5A4DBF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <Text style={styles.createBtnText}>Generate Your First Reply</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleConversationPress(item)}
              style={({ pressed }) => [styles.conversationItem, pressed && styles.pressed]}
            >
              <View style={styles.itemContent}>
                <View style={styles.scoreContainer}>
                  <View
                    style={[
                      styles.scoreCircle,
                      { backgroundColor: "#7B6CFF40" },
                    ]}
                  >
                    <Text style={styles.scoreText}>{item.score}</Text>
                  </View>
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.inputText} numberOfLines={2}>
                    {truncateText(item.inputText, 60)}
                  </Text>
                  <Text style={styles.scoreLabel}>{item.scoreLabel}</Text>
                </View>

                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#7B6CFF" />
                </View>
              </View>

              {/* Quick personality preview */}
              <View style={styles.personalitiesPreview}>
                {Object.entries(item.replies)
                  .slice(0, 3)
                  .map(([key]) => (
                    <View
                      key={key}
                      style={[
                        styles.personalityBadge,
                        { backgroundColor: PERSONALITY_COLORS[key] + "30" },
                      ]}
                    >
                      <Text style={styles.personalityEmoji}>
                        {PERSONALITY_EMOJIS[key]}
                      </Text>
                    </View>
                  ))}
                {Object.keys(item.replies).length > 3 && (
                  <View style={styles.moreCount}>
                    <Text style={styles.moreCountText}>+{Object.keys(item.replies).length - 3}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7B6CFF"
            />
          }
          contentContainerStyle={styles.listContent}
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A1A",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A3E",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#1A1A3E",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  headerSpacer: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8891A8",
    marginTop: 8,
    textAlign: "center",
  },
  createBtn: {
    marginTop: 24,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  conversationItem: {
    backgroundColor: "#1A1A3E",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A4E",
  },
  pressed: {
    opacity: 0.7,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreContainer: {
    marginRight: 12,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7B6CFF30",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7B6CFF",
  },
  textContainer: {
    flex: 1,
  },
  inputText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFF",
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#8891A8",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#8891A8",
    marginRight: 4,
  },
  personalitiesPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 60,
    gap: 4,
  },
  personalityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  personalityEmoji: {
    fontSize: 14,
  },
  moreCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7B6CFF30",
    justifyContent: "center",
    alignItems: "center",
  },
  moreCountText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#7B6CFF",
  },
});

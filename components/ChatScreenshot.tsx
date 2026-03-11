import React, { forwardRef } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";

interface ChatScreenshotProps {
  inputText: string;
  reply: string;
  personalityLabel: string;
  personalityEmoji: string;
  personalityColor: string;
}

/**
 * Renders a fake chat UI screenshot for sharing
 * Shows original message and GhostReply's suggested reply
 */
export const ChatScreenshot = forwardRef<View, ChatScreenshotProps>(
  (
    {
      inputText,
      reply,
      personalityLabel,
      personalityEmoji,
      personalityColor,
    },
    ref
  ) => {
    const screenWidth = Dimensions.get("window").width;

    return (
      <View
        ref={ref}
        style={styles.container}
      >
        <LinearGradient
          colors={["#0A0A1A", "#0F0F2E"]}
          style={StyleSheet.absoluteFill}
        />
        {/* Header with GhostReply branding */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GhostReply</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Replies</Text>
        </View>

        {/* Chat message area */}
        <View style={styles.chatContainer}>
          {/* User's original message */}
          <View style={styles.messageRow}>
            <View style={[styles.messageBubble, styles.userMessage]}>
              <Text style={styles.messageText}>{inputText}</Text>
            </View>
          </View>

          {/* GhostReply's suggested reply with personality */}
          <View style={[styles.messageRow, styles.ghostReplyRow]}>
            <View
              style={[
                styles.messageBubble,
                styles.botsMessage,
                { borderLeftColor: personalityColor, borderLeftWidth: 4 },
              ]}
            >
              <View style={styles.personalityLabel}>
                <Text style={styles.personalityEmoji}>{personalityEmoji}</Text>
                <Text style={[styles.personalityName, { color: personalityColor }]}>
                  {personalityLabel}
                </Text>
              </View>
              <Text style={styles.messageText}>{reply}</Text>
            </View>
          </View>
        </View>

        {/* Footer with CTA */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated with GhostReply</Text>
          <Text style={styles.footerSubtext}>
            Get AI-powered replies for every conversation
          </Text>
          <Text style={styles.cta}>Download now on App Store & Play Store</Text>
        </View>
      </View>
    );
  }
);

ChatScreenshot.displayName = "ChatScreenshot";

const styles = StyleSheet.create({
  container: {
    width: 420,
    height: 600,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#0A0A1A",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9B9BBF",
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  messageRow: {
    justifyContent: "flex-end",
  },
  ghostReplyRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: "rgba(123, 108, 255, 0.2)",
    borderBottomRightRadius: 2,
  },
  botsMessage: {
    backgroundColor: "rgba(78, 205, 196, 0.15)",
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
    fontWeight: "500",
  },
  personalityLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  personalityEmoji: {
    fontSize: 18,
  },
  personalityName: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopColor: "rgba(155, 155, 191, 0.2)",
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: "#9B9BBF",
    marginBottom: 12,
  },
  cta: {
    fontSize: 12,
    color: "#4ECDC4",
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: "#4ECDC4",
    borderWidth: 1,
    borderRadius: 8,
  },
});

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import { apiRequest } from "@/lib/query-client";
import { Header } from "@/components/Header";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { InsightCard } from "@/components/InsightCard";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "@/constants/designTokens";

interface AIResult {
  situation: string;
  strategy: string;
  insights: string[];
  replies: {
    professional: string;
    warm: string;
    confident: string;
  };
}

interface ReplyOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const REPLY_OPTIONS: ReplyOption[] = [
  {
    id: "professional",
    title: "Professional",
    description: "Polished and business-appropriate",
    icon: "briefcase",
    color: Colors.primary,
  },
  {
    id: "warm",
    title: "Warm",
    description: "Friendly while staying professional",
    icon: "heart",
    color: "#EC4899",
  },
  {
    id: "confident",
    title: "Confident",
    description: "Direct and authoritative",
    icon: "lightning-bolt",
    color: "#F59E0B",
  },
];

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { deviceId } = useApp();
  const { requirePremiumAccess } = useSubscription();

  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState<string>("professional");
  const [copied, setCopied] = useState(false);

  // Load analysis result
  React.useEffect(() => {
    const loadResult = async () => {
      try {
        const response = await apiRequest("GET", `/api/result/${params.analysisId}`);
        const payload = await response.json();
        const resultData = payload?.data ?? payload;

        if (resultData?.situation || resultData?.strategy || resultData?.replies) {
          setResult({
            situation: resultData.situation ?? "",
            strategy: resultData.strategy ?? resultData.analysis ?? "",
            insights: Array.isArray(resultData.insights)
              ? resultData.insights
              : [resultData.scoreAdvice ?? "Keep the communication clear and professional."],
            replies: {
              professional: resultData.replies?.professional ?? resultData.replies?.confident ?? "",
              warm: resultData.replies?.warm ?? resultData.replies?.smart ?? "",
              confident: resultData.replies?.confident ?? resultData.replies?.professional ?? "",
            },
          });
        } else {
          Alert.alert("Error", "Failed to load analysis");
          router.back();
        }
      } catch (error) {
        Alert.alert("Error", "Something went wrong");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (params.analysisId) {
      loadResult();
    }
  }, [params.analysisId]);

  const handleCopyReply = async () => {
    try {
      const reply =
        result?.replies[selectedReply as keyof typeof result.replies] || "";
      await Clipboard.setStringAsync(reply);
      setCopied(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const handleShare = async () => {
    try {
      const reply =
        result?.replies[selectedReply as keyof typeof result.replies] || "";
      await Share.share({
        message: `GhostReply helped me craft this professional response:\n\n${reply}`,
        title: "Share Reply",
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Container scrollable={false} edges={false}>
        <Header showBackButton title="Loading..." />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="loading"
            size={48}
            color={Colors.primary}
          />
          <Text
            style={[
              Typography.styles.body1,
              { color: Colors.dark.textSecondary, marginTop: Spacing[3] },
            ]}
          >
            Analyzing your situation...
          </Text>
        </View>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container scrollable={false} edges={false}>
        <Header showBackButton title="Error" />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={[Typography.styles.body1, { color: Colors.error }]}>
            Could not load analysis
          </Text>
          <Button
            variant="primary"
            style={{ marginTop: Spacing[4] }}
            onPress={() => router.back()}
          >
            Go Back
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <Container scrollable edges={false} padding={Spacing[4]}>
      <Header showBackButton title="Communication Strategy" />

      {/* Situation Summary */}
      <Card variant="outlined" style={{ marginBottom: Spacing[6] }}>
        <Text
          style={[
            Typography.styles.caption1,
            { color: Colors.primary, marginBottom: Spacing[2] },
          ]}
        >
          YOUR SITUATION
        </Text>
        <Text
          style={[
            Typography.styles.body1,
            {
              color: Colors.dark.textPrimary,
              lineHeight: 24,
            },
          ]}
        >
          {result.situation}
        </Text>
      </Card>

      {/* Strategy */}
      <Card
        variant="outlined"
        style={{ marginBottom: Spacing[6], borderColor: Colors.primary + "40" }}
      >
        <View style={{ flexDirection: "row", gap: Spacing[2] }}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={24}
            color={Colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                Typography.styles.caption1,
                { color: Colors.primary, marginBottom: Spacing[2] },
              ]}
            >
              RECOMMENDED STRATEGY
            </Text>
            <Text
              style={[
                Typography.styles.body1,
                {
                  color: Colors.dark.textPrimary,
                  lineHeight: 24,
                  fontWeight: "500",
                },
              ]}
            >
              {result.strategy}
            </Text>
          </View>
        </View>
      </Card>

      {/* Reply Options */}
      <Text
        style={[
          Typography.styles.overline,
          {
            color: Colors.dark.textMuted,
            marginBottom: Spacing[3],
          },
        ]}
      >
        REPLY OPTIONS
      </Text>

      <View style={{ gap: Spacing[3], marginBottom: Spacing[6] }}>
        {REPLY_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => {
              setSelectedReply(option.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Card
              variant={selectedReply === option.id ? "default" : "outlined"}
              padding={Spacing[3]}
              gap={Spacing[2]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing[2],
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: BorderRadius.md,
                    backgroundColor: option.color + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: selectedReply === option.id ? 2 : 0,
                    borderColor:
                      selectedReply === option.id ? option.color : "transparent",
                  }}
                >
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={20}
                    color={option.color}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      Typography.styles.button,
                      { color: Colors.dark.textPrimary },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      Typography.styles.caption2,
                      { color: Colors.dark.textSecondary },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Selected Reply */}
      <Card
        variant="default"
        padding={Spacing[4]}
        gap={Spacing[3]}
        style={{ marginBottom: Spacing[6] }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={[
              Typography.styles.caption1,
              { color: Colors.primary },
            ]}
          >
            YOUR RESPONSE
          </Text>
          <Pressable
            onPress={handleCopyReply}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing[1],
              paddingHorizontal: Spacing[2],
              paddingVertical: Spacing[1],
              borderRadius: BorderRadius.base,
              backgroundColor: Colors.dark.bgTertiary,
            }}
          >
            <MaterialCommunityIcons
              name={copied ? "check" : "content-copy"}
              size={16}
              color={Colors.dark.textSecondary}
            />
            <Text
              style={[
                Typography.styles.caption2,
                { color: Colors.dark.textSecondary },
              ]}
            >
              {copied ? "Copied!" : "Copy"}
            </Text>
          </Pressable>
        </View>

        <Text
          style={[
            Typography.styles.body1,
            {
              color: Colors.dark.textPrimary,
              lineHeight: 24,
              fontWeight: "500",
            },
          ]}
        >
          {result.replies[selectedReply as keyof typeof result.replies]}
        </Text>
      </Card>

      {/* Communication Insights */}
      <Text
        style={[
          Typography.styles.overline,
          {
            color: Colors.dark.textMuted,
            marginBottom: Spacing[3],
          },
        ]}
      >
        COMMUNICATION INSIGHTS
      </Text>

      <View style={{ gap: Spacing[3], marginBottom: Spacing[6] }}>
        {result.insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={{ gap: Spacing[2], paddingBottom: insets.bottom + Spacing[2] }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleCopyReply}
          icon={
            <MaterialCommunityIcons
              name="content-copy"
              size={20}
              color={Colors.white}
            />
          }
        >
          Copy Response
        </Button>

        <View style={{ flexDirection: "row", gap: Spacing[2] }}>
          <Button
            variant="secondary"
            size="lg"
            style={{ flex: 1 }}
            icon={
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color={Colors.neutral[900]}
              />
            }
          >
            Regenerate
          </Button>

          <Button
            variant="secondary"
            size="lg"
            style={{ flex: 1 }}
            onPress={handleShare}
            icon={
              <MaterialCommunityIcons
                name="share-variant"
                size={20}
                color={Colors.neutral[900]}
              />
            }
          >
            Share
          </Button>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({});

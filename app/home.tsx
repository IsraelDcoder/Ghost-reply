import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/context/SubscriptionContextWithRevenueCat";
import { Header } from "@/components/Header";
import { Container } from "@/components/Container";
import { WorkflowCard, WorkflowType } from "@/components/WorkflowCard";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "@/constants/designTokens";
import {
  extractTextFromImage,
  validateChatText,
  formatOCRForAnalysis,
} from "@/lib/ocr";
import { apiRequest } from "@/lib/query-client";

const { width } = Dimensions.get("window");

interface WorkflowConfig {
  id: WorkflowType;
  title: string;
  description: string;
  icon: string;
}

const WORKFLOWS: WorkflowConfig[] = [
  {
    id: "winClient",
    title: "Win New Client",
    description: "Convert inquiries into projects professionally.",
    icon: "briefcase-plus",
  },
  {
    id: "negotiate",
    title: "Negotiate Pricing",
    description: "Discuss rates with confidence and clarity.",
    icon: "handshake",
  },
  {
    id: "followUp",
    title: "Follow Up",
    description: "Get replies and keep projects on track.",
    icon: "email-multiple",
  },
  {
    id: "requestPayment",
    title: "Request Payment",
    description: "Ask for money professionally.",
    icon: "cash-multiple",
  },
  {
    id: "handleFeedback",
    title: "Handle Feedback",
    description: "Respond to feedback with professionalism.",
    icon: "comment-check",
  },
  {
    id: "difficultConversation",
    title: "Difficult Conversation",
    description: "Navigate challenging discussions.",
    icon: "alert-circle",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { incrementReplyCount } = useApp();
  const { loading, refreshSubscriptionStatus, requirePremiumAccess } =
    useSubscription();
  const [showDescribeMode, setShowDescribeMode] = useState(false);
  const [situationText, setSituationText] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Refresh subscription status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("[Home] Screen focused - refreshing subscription status");
      refreshSubscriptionStatus();
    }, [refreshSubscriptionStatus])
  );

  const handleWorkflowPress = async (workflow: WorkflowType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedWorkflow(workflow);

    // Navigate based on whether user has input or needs to provide it
    if (showDescribeMode && situationText.trim()) {
      handleAnalyzeSituation(workflow);
    } else {
      // Show input screen
      setShowDescribeMode(true);
    }
  };

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!requirePremiumAccess()) {
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setIsExtracting(true);

      try {
        // Extract text from screenshot
        const ocrResult = await extractTextFromImage(imageUri);

        if (!ocrResult.success) {
          setIsExtracting(false);
          Alert.alert(
            "OCR Failed",
            ocrResult.error ||
              "Could not extract text from image. Please try another image."
          );
          return;
        }

        // Validate that it looks like a chat
        const validation = validateChatText(ocrResult.text);
        if (!validation.isValid) {
          setIsExtracting(false);
          Alert.alert(
            "Not a valid conversation",
            validation.reason ||
              "The extracted text doesn't look like a conversation. Please upload a chat screenshot.",
            [
              {
                text: "Try another image",
                onPress: () => handlePickImage(),
              },
            ]
          );
          return;
        }

        // Use the extracted text
        setSituationText(ocrResult.text);
        setShowDescribeMode(false);
        setIsExtracting(false);
      } catch (error) {
        setIsExtracting(false);
        Alert.alert("Error", "Failed to extract text from image");
      }
    }
  };

  const handleAnalyzeSituation = async (workflow: WorkflowType = selectedWorkflow!) => {
    if (!situationText.trim()) {
      Alert.alert("Input required", "Please describe the situation");
      return;
    }

    if (!requirePremiumAccess()) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // API call to analyze the situation
      const response = await apiRequest("POST", "/api/analyze", {
        text: situationText,
        workflow,
      });

      const payload = await response.json();
      const analysisId = payload?.data?.id ?? payload?.id;

      if (payload?.success !== false && analysisId) {
        // Navigate to result screen with the analysis
        router.push({
          pathname: "/result",
          params: {
            analysisId,
            workflow,
          },
        });

        incrementReplyCount();
        setIsAnalyzing(false);
        setSituationText("");
        setShowDescribeMode(false);
        setSelectedWorkflow(null);
      } else {
        Alert.alert("Error", payload?.error || "Failed to analyze situation");
        setIsAnalyzing(false);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      setIsAnalyzing(false);
    }
  };

  return (
    <Container scrollable={true} edges={false}>
      {/* Header */}
      <Header
        largeTitle={!showDescribeMode}
        title={showDescribeMode ? "Describe the Situation" : "Good morning"}
        subtitle={
          showDescribeMode
            ? "Tell us what's happening so we can help you communicate professionally."
            : "What do you need to communicate about?"
        }
        showBackButton={false}
      />

      <View style={{ padding: Spacing[4] }}>
        {!showDescribeMode ? (
          <>
            {/* Quick Actions */}
            <View style={{ gap: Spacing[3], marginBottom: Spacing[6] }}>
              {/* Screenshot Upload */}
              <Card pressable onPress={handlePickImage}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing[3],
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: BorderRadius.md,
                      backgroundColor: Colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="camera"
                      size={24}
                      color={Colors.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        Typography.styles.h4,
                        { color: Colors.dark.textPrimary },
                      ]}
                    >
                      Upload Screenshot
                    </Text>
                    <Text
                      style={[
                        Typography.styles.body2,
                        { color: Colors.dark.textSecondary },
                      ]}
                    >
                      Extract text from a conversation
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={Colors.dark.textMuted}
                  />
                </View>
              </Card>

              {/* Describe Situation */}
              <Card
                pressable
                onPress={() => setShowDescribeMode(true)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing[3],
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: BorderRadius.md,
                      backgroundColor: Colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="chat-outline"
                      size={24}
                      color={Colors.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        Typography.styles.h4,
                        { color: Colors.dark.textPrimary },
                      ]}
                    >
                      Describe Situation
                    </Text>
                    <Text
                      style={[
                        Typography.styles.body2,
                        { color: Colors.dark.textSecondary },
                      ]}
                    >
                      Tell us what is happening
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={Colors.dark.textMuted}
                  />
                </View>
              </Card>
            </View>

            {/* Workflows */}
            <Text
              style={[
                Typography.styles.overline,
                {
                  color: Colors.dark.textMuted,
                  marginBottom: Spacing[3],
                },
              ]}
            >
              Common Workflows
            </Text>

            <View style={{ gap: Spacing[3] }}>
              {WORKFLOWS.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  type={workflow.id}
                  title={workflow.title}
                  description={workflow.description}
                  icon={
                    <MaterialCommunityIcons
                      name={workflow.icon as any}
                      size={24}
                      color={Colors.workflows[workflow.id as keyof typeof Colors.workflows] ?? Colors.primary}
                    />
                  }
                  onPress={() => handleWorkflowPress(workflow.id)}
                />
              ))}

              {/* Something Else Option */}
              <WorkflowCard
                type="somethingElse"
                title="Something Else"
                description="Custom communication scenario"
                icon={
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={24}
                    color={Colors.workflows.winClient}
                  />
                }
                onPress={() => handleWorkflowPress("somethingElse" as WorkflowType)}
              />
            </View>
          </>
        ) : (
          <>
            {/* Input Mode */}
            <Input
              placeholder="Describe what happened..."
              value={situationText}
              onChangeText={setSituationText}
              multiline
              numberOfLines={6}
              containerStyle={{ marginBottom: Spacing[6] }}
            />

            {/* Workflow Selection */}
            {!selectedWorkflow && (
              <>
                <Text
                  style={[
                    Typography.styles.overline,
                    {
                      color: Colors.dark.textMuted,
                      marginBottom: Spacing[3],
                    },
                  ]}
                >
                  Select a workflow
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: Spacing[6] }}
                  contentContainerStyle={{ gap: Spacing[3] }}
                >
                  {WORKFLOWS.map((workflow) => (
                    <Pressable
                      key={workflow.id}
                      onPress={() => {
                        setSelectedWorkflow(workflow.id);
                        handleAnalyzeSituation(workflow.id);
                      }}
                      style={{
                        minWidth: width * 0.5 - Spacing[6],
                      }}
                    >
                      <Card
                        variant="outlined"
                        padding={Spacing[3]}
                        gap={Spacing[2]}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: BorderRadius.md,
                            backgroundColor:
                              (Colors.workflows[workflow.id as keyof typeof Colors.workflows] ?? Colors.primary) + "20",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <MaterialCommunityIcons
                            name={workflow.icon as any}
                            size={18}
                            color={Colors.workflows[workflow.id as keyof typeof Colors.workflows] ?? Colors.primary}
                          />
                        </View>

                        <Text
                          style={[
                            Typography.styles.button,
                            { color: Colors.dark.textPrimary },
                          ]}
                          numberOfLines={2}
                        >
                          {workflow.title}
                        </Text>
                      </Card>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Action Buttons */}
            <View style={{ gap: Spacing[2] }}>
              <Button
                variant="primary"
                size="lg"
                isLoading={isAnalyzing}
                isDisabled={
                  !situationText.trim() || isAnalyzing || isExtracting
                }
                onPress={() =>
                  handleAnalyzeSituation(selectedWorkflow || "winClient" as WorkflowType)
                }
              >
                Analyze Situation
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => {
                  setShowDescribeMode(false);
                  setSituationText("");
                  setSelectedWorkflow(null);
                }}
              >
                Cancel
              </Button>
            </View>
          </>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({});

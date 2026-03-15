/**
 * GhostReply Demo Video Onboarding Screen
 * 
 * High-converting narrative onboarding that demonstrates:
 * Problem → Solution → Success structure
 * 
 * This screen is critical for converting users before paywall
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";
import { Video, AVPlaybackStatus } from "expo-av";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

const { width, height } = Dimensions.get("window");

export default function DemoVideoScreen() {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;

  const [isPlaying, setIsPlaying] = useState(true);
  const [hasWatched, setHasWatched] = useState(false);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-play video
    videoRef.current?.playAsync();
  }, [fadeAnim, slideUpAnim]);

  // Track if user has watched enough of the video
  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    setVideoStatus(status);

    if (status.isLoaded && status.durationMillis) {
      // Mark as watched if user gets 50% through
      const watchedPercentage =
        (status.positionMillis / status.durationMillis) * 100;
      if (watchedPercentage > 50) {
        setHasWatched(true);
      }

      // Auto-loop if user hasn't watched enough
      if (status.didJustFinish && !hasWatched) {
        videoRef.current?.playFromPositionAsync(0);
      }
    }
  };

  const handleContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to gender selection
    router.push("/gender-selection");
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/gender-selection");
  };

  const getProgressText = () => {
    if (!videoStatus?.isLoaded || !videoStatus?.durationMillis) {
      return "Loading...";
    }

    const percentage = Math.round(
      (videoStatus.positionMillis / videoStatus.durationMillis) * 100
    );
    return `${percentage}%`;
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        {/* Video Container */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={require("@/assets/images/demo-video.mp4")}
            style={styles.video}
            useNativeControls={false}
            progressUpdateIntervalMillis={500}
            onPlaybackStatusUpdate={handleVideoStatusUpdate}
            isMuted={false}
          />

          {/* Gradient Overlay (optional - adds polish) */}
          <View style={styles.videoOverlay} />

          {/* Skip Button (top right) */}
          <Pressable
            style={styles.skipButton}
            onPress={handleSkip}
            hitSlop={10}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </Pressable>

          {/* Progress Indicator */}
          {videoStatus?.isLoaded && videoStatus?.durationMillis && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      (videoStatus.positionMillis / videoStatus.durationMillis) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Bottom CTA Section */}
        <View style={styles.ctaSection}>
          {/* Headline */}
          <Text style={styles.headline}>Never struggle with replies again.</Text>

          {/* Subheading */}
          <Text style={styles.subheading}>
            AI that writes the perfect reply.
          </Text>

          {/* Continue Button */}
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          {/* Optional: Watch percentage hint */}
          {!hasWatched && (
            <Text style={styles.watchHint}>
              Watch the demo - {getProgressText()} complete
            </Text>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B1A",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },

  /* Video Styles */
  videoContainer: {
    flex: 2,
    width: "100%",
    backgroundColor: "#000000",
    position: "relative",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    pointerEvents: "none",
  },

  /* Skip Button */
  skipButton: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skipButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  /* Progress Bar */
  progressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#7C3AED",
  },

  /* CTA Section */
  ctaSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "space-between",
    backgroundColor: "#0B0B1A",
  },

  /* Headline */
  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  /* Subheading */
  subheading: {
    fontSize: 14,
    fontWeight: "400",
    color: "#A0A0A0",
    marginTop: 8,
    lineHeight: 20,
  },

  /* Continue Button */
  continueButton: {
    width: "100%",
    paddingVertical: 16,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#7C3AED",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  continueButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* Watch Hint */
  watchHint: {
    fontSize: 12,
    color: "#606080",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "400",
  },
});

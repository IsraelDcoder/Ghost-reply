import * as FileSystem from "expo-file-system";
import * as ML from "@react-native-ml-kit/text-recognition";
import type { TextRecognitionResult } from "@react-native-ml-kit/text-recognition";

/**
 * Options for OCR processing
 */
export interface OCROptions {
  language?: string;
  maxHeight?: number;
  maxWidth?: number;
}

/**
 * Result from OCR processing
 */
export interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
  success: boolean;
  error?: string;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

/**
 * Extract text from image file using Google ML Kit
 * Works with local file paths or base64 data
 */
export async function extractTextFromImage(
  imageUri: string,
  options: OCROptions = {}
): Promise<OCRResult> {
  try {
    // Validate input
    if (!imageUri) {
      return {
        text: "",
        confidence: 0,
        blocks: [],
        success: false,
        error: "Image URI is required",
      };
    }

    // Process image with ML Kit
    const recognizedTextOnDevice = await ML.default.recognize(imageUri);

    if (!recognizedTextOnDevice || !recognizedTextOnDevice.text) {
      return {
        text: "",
        confidence: 0,
        blocks: [],
        success: false,
        error: "No text found in image",
      };
    }

    // Extract blocks information
    const blocks: TextBlock[] = [];

    // Process blocks if available
    if (Array.isArray(recognizedTextOnDevice.blocks)) {
      for (const block of recognizedTextOnDevice.blocks) {
        blocks.push({
          text: block.text || "",
          confidence: 0.9, // ML Kit doesn't provide confidence, use high default for recognized text
          boundingBox: block.frame
            ? {
                left: block.frame.left,
                top: block.frame.top,
                right: block.frame.left + block.frame.width,
                bottom: block.frame.top + block.frame.height,
              }
            : undefined,
        });
      }
    }

    // Since recognized text was successfully extracted, confidence is high
    const averageConfidence = blocks.length > 0 ? 0.9 : 0.85;

    // Clean and format extracted text
    const cleanedText = cleanOCRText(recognizedTextOnDevice.text);

    return {
      text: cleanedText,
      confidence: Math.min(averageConfidence, 1.0),
      blocks: blocks,
      success: true,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("OCR Error:", errorMsg);

    return {
      text: "",
      confidence: 0,
      blocks: [],
      success: false,
      error: `Failed to extract text: ${errorMsg}`,
    };
  }
}

/**
 * Clean OCR text by removing noise and formatting
 */
function cleanOCRText(text: string): string {
  if (!text) return "";

  return (
    text
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      // Remove common OCR artifacts
      .replace(/\|/g, "l")
      .replace(/0O/g, "00")
      // Remove URLs/website addresses
      .replace(/https?:\/\/\S+/g, "[URL]")
      // Trim
      .trim()
  );
}

/**
 * Validate if extracted text looks like a chat conversation
 */
export function validateChatText(text: string): {
  isValid: boolean;
  reason?: string;
  score: number;
} {
  const score = calculateChatScore(text);

  // Minimum requirements for chat text
  const hasMinimumLength = text.length > 20;
  const hasQuotationMarks =
    text.includes('"') || text.includes("'") || text.includes('"');
  const hasCommonChatPatterns =
    /\b(hey|hi|hello|thanks|ok|yeah|lol|haha|what|when|where|who|why)\b/i.test(
      text
    );

  const isValid =
    hasMinimumLength && (hasQuotationMarks || hasCommonChatPatterns);

  return {
    isValid,
    reason: !hasMinimumLength
      ? "Text too short for meaningful analysis"
      : !hasQuotationMarks && !hasCommonChatPatterns
        ? "Doesn't look like a chat conversation"
        : undefined,
    score,
  };
}

/**
 * Calculate a "chat score" to determine if text looks like a conversation
 */
function calculateChatScore(text: string): number {
  let score = 0;

  // Check for conversational language
  if (
    /\b(hey|hi|hello|thanks|ok|yeah|lol|haha|what|when|where|who|why|can|will|should|could)\b/i.test(
      text
    )
  ) {
    score += 0.3;
  }

  // Check for punctuation variety (indicates natural speech)
  const hasPunctuation =
    /[.!?:;,]/.test(text) && /[?!]/.test(text);
  if (hasPunctuation) {
    score += 0.2;
  }

  // Check for emoji or casual language (common emoji Unicode ranges)
  if (/[\u{1F300}-\u{1F9FF}]/u.test(text)) {
    score += 0.2;
  }

  // Check for message-like structure (short lines)
  const lines = text.split("\n");
  if (lines.length > 1 && lines.some((l) => l.length < 100)) {
    score += 0.15;
  }

  // Check for quotation marks (indicates dialogue)
  if (/["']/.test(text)) {
    score += 0.15;
  }

  return Math.min(score, 1.0);
}

/**
 * Format OCR text for AI analysis
 * Adds context about source
 */
export function formatOCRForAnalysis(
  ocrText: string,
  confidence: number
): string {
  const confidenceNote =
    confidence < 0.7
      ? " [Note: Image quality affects accuracy]"
      : confidence < 0.85
        ? " [Note: Some text may be unclear]"
        : "";

  return `From a screenshot${confidenceNote}:\n\n${ocrText}`;
}

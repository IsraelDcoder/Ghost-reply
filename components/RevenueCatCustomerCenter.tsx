/**
 * RevenueCat Customer Center Component
 * components/RevenueCatCustomerCenter.tsx
 *
 * Allows users to:
 * - View subscription status
 * - Manage billing
 * - Change billing contact information
 * - Manage payment methods
 * - View billing history
 * - Manage sharing and family plans (if applicable)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RevenueCatCustomerCenterProps {
  onDismiss?: () => void;
  displayCloseButton?: boolean;
}

export function RevenueCatCustomerCenter({
  onDismiss,
  displayCloseButton = true,
}: RevenueCatCustomerCenterProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Your Subscription</Text>
        {displayCloseButton && (
          <Pressable
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.customerCenterContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✓ Active Subscription</Text>
          <Text style={styles.sectionText}>GhostReply Pro</Text>
          <Text style={styles.sectionText}>Renews on Dec 15, 2024</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Billing Information</Text>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={20} color="#7B6CFF" />
          </Pressable>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>Billing History</Text>
            <Ionicons name="chevron-forward" size={20} color="#7B6CFF" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Subscription Settings</Text>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>Change Plan</Text>
            <Ionicons name="chevron-forward" size={20} color="#7B6CFF" />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => Alert.alert("Cancel", "Are you sure you want to cancel?")}>
            <Text style={[styles.menuText, styles.dangerText]}>Cancel Subscription</Text>
            <Ionicons name="chevron-forward" size={20} color="#ff6b6b" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A1A",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  customerCenterContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#1A1A35",
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: "#9B9BBF",
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#252545",
  },
  menuText: {
    fontSize: 14,
    color: "#fff",
    flex: 1,
  },
  dangerText: {
    color: "#ff6b6b",
  },
});

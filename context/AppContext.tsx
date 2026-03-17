import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setDeviceId as setQueryClientDeviceId } from "../lib/query-client";

const DAILY_LIMIT = 2;
const STORAGE_KEYS = {
  REPLY_COUNT: "ghost_reply_count",
  REPLY_DATE: "ghost_reply_date",
  HAS_ONBOARDED: "ghost_has_onboarded",
  IS_SUBSCRIBED: "ghost_is_subscribed",
  DEVICE_ID: "ghost_device_id",
};

// Simple UUID generator without crypto dependency
function generateSimpleId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
}

interface AppContextType {
  hasOnboarded: boolean;
  setHasOnboarded: (v: boolean) => void;
  isSubscribed: boolean;
  setIsSubscribed: (v: boolean) => void;
  repliesUsedToday: number;
  canGenerateReply: boolean;
  incrementReplyCount: () => Promise<void>;
  remainingReplies: number;
  deviceId: string | null;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboardedState] = useState(false);
  const [isSubscribed, setIsSubscribedState] = useState(false);
  const [repliesUsedToday, setRepliesUsedToday] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    try {
      const [onboarded, subscribed, count, date, savedDeviceId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED),
        AsyncStorage.getItem(STORAGE_KEYS.IS_SUBSCRIBED),
        AsyncStorage.getItem(STORAGE_KEYS.REPLY_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.REPLY_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID),
      ]);

      setHasOnboardedState(onboarded === "true");
      setIsSubscribedState(subscribed === "true");

      // Generate or use existing device ID
      let deviceIdToUse = savedDeviceId;
      if (!deviceIdToUse) {
        deviceIdToUse = `device_${generateSimpleId()}`;
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceIdToUse);
      }
      setDeviceId(deviceIdToUse);
      // Tell query-client about the device ID for API requests
      setQueryClientDeviceId(deviceIdToUse);
      console.log("[AppContext] Device ID set:", deviceIdToUse);

      const today = new Date().toDateString();
      if (date === today && count) {
        setRepliesUsedToday(parseInt(count, 10));
      } else if (date !== today) {
        await AsyncStorage.setItem(STORAGE_KEYS.REPLY_COUNT, "0");
        await AsyncStorage.setItem(STORAGE_KEYS.REPLY_DATE, today);
        setRepliesUsedToday(0);
      }
    } catch (e) {
      console.error("Failed to load state:", e);
    } finally {
      setIsLoading(false);
    }
  }

  const setHasOnboarded = async (v: boolean) => {
    setHasOnboardedState(v);
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, v ? "true" : "false");
  };

  const setIsSubscribed = async (v: boolean) => {
    setIsSubscribedState(v);
    await AsyncStorage.setItem(STORAGE_KEYS.IS_SUBSCRIBED, v ? "true" : "false");
  };

  const incrementReplyCount = async () => {
    const newCount = repliesUsedToday + 1;
    setRepliesUsedToday(newCount);
    await AsyncStorage.setItem(STORAGE_KEYS.REPLY_COUNT, newCount.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.REPLY_DATE, new Date().toDateString());
  };

  const canGenerateReply = isSubscribed || repliesUsedToday < DAILY_LIMIT;
  const remainingReplies = Math.max(0, DAILY_LIMIT - repliesUsedToday);

  return (
    <AppContext.Provider
      value={{
        hasOnboarded,
        setHasOnboarded,
        isSubscribed,
        setIsSubscribed,
        repliesUsedToday,
        canGenerateReply,
        incrementReplyCount,
        remainingReplies,
        deviceId,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

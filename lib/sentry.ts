import * as Sentry from "@sentry/react-native";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: false,
    enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  });
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    Sentry.captureException(error);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  Sentry.captureMessage(message, level);
};

export const setUser = (userId: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    email,
  });
};

export const clearUser = () => {
  Sentry.setUser(null);
};

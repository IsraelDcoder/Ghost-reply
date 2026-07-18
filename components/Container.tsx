import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing } from "@/constants/designTokens";

export interface ContainerProps extends Omit<ScrollViewProps, "style"> {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  padding?: number;
  scrollable?: boolean;
  gap?: number;
  edges?: boolean;
}

export const Container = React.forwardRef<ScrollView, ContainerProps>(
  (
    {
      children,
      style,
      backgroundColor = Colors.dark.bgPrimary,
      padding = Spacing[4],
      scrollable = true,
      gap,
      edges = true,
      contentContainerStyle,
      ...rest
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();

    const containerStyle = {
      flexGrow: 1,
      paddingHorizontal: padding,
      paddingTop: edges ? insets.top + padding : padding,
      paddingBottom: edges ? insets.bottom + padding : padding,
      backgroundColor,
      gap,
    };

    if (!scrollable) {
      return (
        <View
          style={[
            {
              flex: 1,
              backgroundColor,
              paddingHorizontal: padding,
              paddingTop: edges ? insets.top + padding : padding,
              paddingBottom: edges ? insets.bottom + padding : padding,
              gap,
            },
            style,
          ]}
        >
          {children}
        </View>
      );
    }

    return (
      <ScrollView
        ref={ref}
        style={[{ flex: 1, backgroundColor }, style]}
        contentContainerStyle={[containerStyle, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }
);

Container.displayName = "Container";

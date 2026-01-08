"use client";

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";

/**
 * Test component to verify react-native-web integration works
 * This component uses React Native primitives that are aliased to react-native-web
 *
 * Note: className support requires NativeWind. Without it, use StyleSheet or style prop.
 * gluestack-ui components will handle the styling abstraction.
 */
export function RNWebTest() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Web Test</Text>
      <Text style={styles.description}>
        This component uses View, Text, and Pressable from react-native
      </Text>
      <View style={styles.row}>
        <Text style={styles.count}>{count}</Text>
        <Pressable
          onPress={() => setCount((c) => c + 1)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Increment</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  description: {
    color: "#4b5563",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  count: {
    fontSize: 20,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
});

import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { testSupabaseConnection, type TestResults } from "@/lib/test-supabase";

export default function SettingsScreen() {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const results = await testSupabaseConnection();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        status: 'error',
        results: {
          connection: { status: 'error', data: null, error: error instanceof Error ? error.message : 'Unknown error' },
          boxTypes: { status: 'not_tested', data: null, error: null },
          categories: { status: 'not_tested', data: null, error: null },
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.description}>App settings and preferences</Text>

        <TouchableOpacity
          style={[styles.button, testing && styles.buttonDisabled]}
          onPress={runTest}
          disabled={testing}
        >
          {testing ? (
            <>
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Testing...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Test Supabase Connection</Text>
          )}
        </TouchableOpacity>

        {testResults && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Test Results: {testResults.status}
            </Text>
            <View style={styles.resultsBox}>
              <Text style={styles.resultsText}>
                {JSON.stringify(testResults, null, 2)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#999",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    marginTop: 24,
    width: "100%",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  resultsBox: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 8,
    maxHeight: 400,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
});

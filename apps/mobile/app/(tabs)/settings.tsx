import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { testSupabaseConnection, type TestResults } from "@/lib/test-supabase";
import { useAuth } from "../../lib/auth-context";
import type { HouseholdWithRole } from "@boxtrack/shared";

export default function SettingsScreen() {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [testing, setTesting] = useState(false);

  const { user, signOut, activeHousehold, households, switchHousehold } =
    useAuth();
  const router = useRouter();

  const runTest = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const results = await testSupabaseConnection();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        status: "error",
        results: {
          connection: {
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          boxTypes: { status: "not_tested", data: null, error: null },
          categories: { status: "not_tested", data: null, error: null },
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
            {user?.fullName && (
              <View style={styles.row}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{user.fullName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Household Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Active</Text>
              <Text style={styles.value}>{activeHousehold?.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Your Role</Text>
              <Text style={[styles.value, styles.capitalize]}>
                {activeHousehold?.role}
              </Text>
            </View>
          </View>

          {/* Household Switcher (only if multiple) */}
          {households.length > 1 && (
            <View style={styles.householdList}>
              <Text style={styles.subLabel}>Switch Household</Text>
              {households.map((household: HouseholdWithRole) => (
                <TouchableOpacity
                  key={household.id}
                  style={[
                    styles.householdItem,
                    household.id === activeHousehold?.id &&
                      styles.householdItemActive,
                  ]}
                  onPress={() => switchHousehold(household.id)}
                >
                  <Text
                    style={[
                      styles.householdText,
                      household.id === activeHousehold?.id &&
                        styles.householdTextActive,
                    ]}
                  >
                    {household.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Debug Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>
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

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#111827",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
  },
  value: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  capitalize: {
    textTransform: "capitalize",
  },
  subLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 12,
  },
  householdList: {
    marginTop: 8,
  },
  householdItem: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  householdItemActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  householdText: {
    fontSize: 14,
    color: "#374151",
  },
  householdTextActive: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  resultsBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  resultsText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#374151",
  },
  logoutButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#ef4444",
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});

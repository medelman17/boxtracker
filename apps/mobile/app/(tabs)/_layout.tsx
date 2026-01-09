import { Tabs, Redirect } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "../../lib/auth-context";

export default function TabsLayout() {
  const { user, initialized } = useAuth();

  // Show loading while checking auth
  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Boxes",
          tabBarLabel: "Boxes",
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Locations",
          tabBarLabel: "Locations",
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarLabel: "Scan",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

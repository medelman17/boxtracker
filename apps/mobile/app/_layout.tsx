import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../lib/auth-context";
import { GluestackUIProvider } from "../components/ui/gluestack-ui-provider";
import "../global.css";

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="box/[id]" options={{ title: "Box Details" }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </GluestackUIProvider>
  );
}

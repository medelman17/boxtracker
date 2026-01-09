import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { AuthProvider } from "../lib/auth-context";
import { GluestackUIProvider } from "../components/ui/gluestack-ui-provider";
import { parseUniversalLink } from "@boxtrack/shared";
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    // Handle deep links when app opens from a URL
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log("Deep link received:", url);

      // Parse universal links (https://oubx.vercel.app/box/xxx)
      const parsed = parseUniversalLink(url);
      if (parsed) {
        switch (parsed.type) {
          case "box":
            router.push(`/box/${parsed.id}`);
            break;
          case "scan":
            // Scan URLs redirect to box detail
            router.push(`/box/${parsed.id}`);
            break;
          case "label":
            router.push(`/box/${parsed.id}`);
            break;
          case "invite":
            // TODO: Handle invite links when implemented
            console.log("Invite link:", parsed.id);
            break;
        }
        return;
      }

      // Handle legacy custom scheme (boxtrack://box/xxx)
      if (url.startsWith("boxtrack://")) {
        const path = url.replace("boxtrack://", "/");
        router.push(path as any);
      }
    };

    // Handle initial URL (app opened via deep link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log("App opened with URL:", initialUrl);
        handleDeepLink({ url: initialUrl });
      }
    };

    handleInitialURL();

    // Listen for URLs while app is running
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => subscription.remove();
  }, []);

  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="box/[id]" options={{ title: "Box Details" }} />
          <Stack.Screen name="scan/[id]" options={{ title: "Loading..." }} />
          <Stack.Screen name="label/[id]" options={{ title: "Label" }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </GluestackUIProvider>
  );
}

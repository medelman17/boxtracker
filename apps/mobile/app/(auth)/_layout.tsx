import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../lib/auth-context";

export default function AuthLayout() {
  const { user, initialized } = useAuth();

  // Wait for auth initialization
  if (!initialized) {
    return null;
  }

  // Redirect to tabs if already authenticated
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "Sign Up",
          headerShown: true,
        }}
      />
    </Stack>
  );
}

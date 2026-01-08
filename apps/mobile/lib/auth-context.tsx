import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { supabase } from "./supabase";
import type {
  AuthContextValue,
  SessionUser,
  HouseholdWithRole,
  SignupInput,
  LoginInput,
  UserRole,
} from "@boxtrack/shared";
import type { User } from "@supabase/supabase-js";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [households, setHouseholds] = useState<HouseholdWithRole[]>([]);
  const [activeHousehold, setActiveHousehold] =
    useState<HouseholdWithRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Check biometric availability
  const checkBiometrics = useCallback(async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricEnabled(compatible && enrolled);
  }, []);

  // Fetch user households from database
  const fetchHouseholds = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_households")
      .select(
        `
        role,
        joined_at,
        household:households(id, name, slug, created_at, updated_at, deleted_at)
      `
      )
      .eq("user_id", userId)
      .order("joined_at", { ascending: true });

    if (!error && data) {
      const householdsWithRole: HouseholdWithRole[] = data
        .filter((uh) => uh.household !== null)
        .map((uh) => {
          // Supabase returns nested objects; cast through unknown for type safety
          const household = uh.household as unknown as {
            id: string;
            name: string;
            slug: string;
            created_at: string;
            updated_at: string;
            deleted_at: string | null;
          };
          return {
            id: household.id,
            name: household.name,
            slug: household.slug,
            createdAt: household.created_at,
            updatedAt: household.updated_at,
            deletedAt: household.deleted_at,
            role: uh.role as UserRole,
            joinedAt: uh.joined_at,
          };
        });

      setHouseholds(householdsWithRole);

      // Auto-select first household (default) if not already set
      if (householdsWithRole.length > 0) {
        setActiveHousehold((prev) => prev || householdsWithRole[0]);
      }
    }
  }, []);

  // Convert Supabase user to SessionUser
  const toSessionUser = useCallback(
    (supabaseUser: User): SessionUser => ({
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      emailVerified: !!supabaseUser.email_confirmed_at,
      fullName: supabaseUser.user_metadata?.full_name || null,
      createdAt: supabaseUser.created_at,
    }),
    []
  );

  // Initialize auth state from session
  const initializeAuth = useCallback(async () => {
    setLoading(true);
    await checkBiometrics();

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (currentSession?.user) {
      setUser(toSessionUser(currentSession.user));
      await fetchHouseholds(currentSession.user.id);
    }

    setLoading(false);
    setInitialized(true);
  }, [checkBiometrics, fetchHouseholds, toSessionUser]);

  // Setup auth listener on mount
  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === "SIGNED_IN" && currentSession?.user) {
        setUser(toSessionUser(currentSession.user));
        await fetchHouseholds(currentSession.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setHouseholds([]);
        setActiveHousehold(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth, fetchHouseholds, toSessionUser]);

  // Biometric authentication
  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!biometricEnabled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to access BoxTrack",
      fallbackLabel: "Use passcode",
    });

    return result.success;
  };

  // Sign up with email/password
  const signUp = async (
    input: SignupInput
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
        },
      },
    });

    return { error: error?.message || null };
  };

  // Sign in with email/password
  const signIn = async (
    input: LoginInput
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (!error && biometricEnabled) {
      // Prompt user to enable biometrics after successful login
      Alert.alert(
        "Enable biometric login?",
        "Use Face ID / Touch ID for faster login next time.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Enable",
            onPress: () => {
              // Biometric is already set up via SecureStore persistence
            },
          },
        ]
      );
    }

    return { error: error?.message || null };
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  // Switch active household
  const switchHousehold = (householdId: string): void => {
    const household = households.find((h) => h.id === householdId);
    if (household) {
      setActiveHousehold(household);
    }
  };

  // Refresh session (triggers token refresh if needed)
  const refreshSession = async (): Promise<void> => {
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.refreshSession();
    if (refreshedSession?.user) {
      setUser(toSessionUser(refreshedSession.user));
    }
  };

  const value: AuthContextValue = {
    user,
    activeHousehold,
    households,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    switchHousehold,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Export biometric helper for use in screens
export function useBiometrics() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const check = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricEnabled(compatible && enrolled);
    };
    check();
  }, []);

  const authenticate = async (): Promise<boolean> => {
    if (!biometricEnabled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to access BoxTrack",
      fallbackLabel: "Use passcode",
    });

    return result.success;
  };

  return { biometricEnabled, authenticate };
}

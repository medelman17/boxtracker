"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "./supabase";
import type {
  AuthContextValue,
  SessionUser,
  HouseholdWithRole,
  SignupInput,
  LoginInput,
  UserRole,
  UserHouseholdQueryResult,
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

  const supabase = createClient();

  // Fetch user households from database
  const fetchHouseholds = useCallback(
    async (userId: string) => {
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
        // Type the query result (cast through unknown due to Supabase type inference)
        const queryResults = data as unknown as UserHouseholdQueryResult[];

        const householdsWithRole: HouseholdWithRole[] = queryResults
          .filter((uh) => uh.household !== null)
          .map((uh) => {
            const household = uh.household!;
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
        if (householdsWithRole.length > 0 && !activeHousehold) {
          setActiveHousehold(householdsWithRole[0]);
        }
      }
    },
    [supabase, activeHousehold]
  );

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
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (currentSession?.user) {
      setUser(toSessionUser(currentSession.user));
      await fetchHouseholds(currentSession.user.id);
    }

    setLoading(false);
    setInitialized(true);
  }, [supabase, fetchHouseholds, toSessionUser]);

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
  }, [supabase, initializeAuth, fetchHouseholds, toSessionUser]);

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

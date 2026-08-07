import { Session } from "@supabase/supabase-js";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { Household } from "@/lib/types";

type AuthContextValue = {
  session: Session | null;
  household: Household | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  renameHousehold: (name: string) => Promise<void>;
  refreshHousehold: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHousehold = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("household_members")
      .select("households(*)")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Failed to load household", error.message);
      setHousehold(null);
      return;
    }

    const record = data?.households as unknown as Household | undefined;
    setHousehold(record ?? null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session) {
        await loadHousehold(data.session.user.id);
      }
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        await loadHousehold(nextSession.user.id);
      } else {
        setHousehold(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadHousehold]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const joinHousehold = useCallback(
    async (inviteCode: string) => {
      const { error } = await supabase.rpc("join_household_by_code", {
        code: inviteCode.trim(),
      });
      if (error) throw error;
      if (session) await loadHousehold(session.user.id);
    },
    [session, loadHousehold]
  );

  const renameHousehold = useCallback(
    async (name: string) => {
      if (!household) return;
      const { error } = await supabase
        .from("households")
        .update({ name })
        .eq("id", household.id);
      if (error) throw error;
      setHousehold({ ...household, name });
    },
    [household]
  );

  const refreshHousehold = useCallback(async () => {
    if (session) await loadHousehold(session.user.id);
  }, [session, loadHousehold]);

  return (
    <AuthContext.Provider
      value={{
        session,
        household,
        isLoading,
        signUp,
        signIn,
        signOut,
        joinHousehold,
        renameHousehold,
        refreshHousehold,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User, Session } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Fetch profile function
  const fetchProfile = async (userId: string) => {
    console.log("AuthProvider: Fetching profile for user:", userId);
    try {
      const response = await fetch(`/api/profile/${userId}`);
      console.log("AuthProvider: Profile API response status:", response.status);
      
      if (!response.ok) {
        console.error("AuthProvider: Failed to fetch profile with status:", response.status);
        throw new Error("Failed to fetch profile");
      }
      
      const data = await response.json();
      console.log("AuthProvider: Profile data received:", data.profile);
      
      // ALWAYS set role to SUPERADMIN regardless of actual role
      const enhancedProfile = {
        ...data.profile,
        role: "SUPERADMIN"
      };
      
      console.log("AuthProvider: Profile role set to: SUPERADMIN");
      setProfile(enhancedProfile);
    } catch (error) {
      console.error("AuthProvider: Error fetching profile:", error);
      setProfile(null);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Initial session check", session ? "Session found" : "No session");
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log("AuthProvider: User found in session, fetching profile");
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthProvider: Auth state change event:", event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log("AuthProvider: User in session after state change");
        await fetchProfile(session.user.id);
      } else {
        console.log("AuthProvider: No user in session after state change");
        setProfile(null);
      }

      setIsLoading(false);

      if (event === "SIGNED_OUT") {
        router.push("/sign-in");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      await fetchProfile(data.user.id);
    }
    router.push("/dashboard");
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    router.push("/sign-in");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 
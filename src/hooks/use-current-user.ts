"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import { useProfile } from "./use-profile";

type CurrentUserData = {
  user: User | null;
  profile: ReturnType<typeof useProfile>["profile"];
  isLoading: boolean;
  error: Error | null;
  refetch?: () => Promise<void>;
};

export function useCurrentUser(): CurrentUserData {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();
  const { profile, fetchProfile } = useProfile();

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user from Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (userData.user) {
        setUser(userData.user);
        await fetchProfile();
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session) {
            setUser(session.user);
            await fetchProfile();
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth, fetchProfile]);

  return { user, profile, isLoading, error, refetch: fetchUserData };
}

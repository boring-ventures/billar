"use client";

import { useCallback, useEffect, useState } from "react";
import { User, UserRoleType } from "@/types/user";

interface EnhancedUser extends Omit<User, 'role'> {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email?: string;
  role: UserRoleType;
  companyId: string | null;
  active: boolean;
  avatarUrl?: string | null;
  company?: {
    name: string;
  } | null;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<EnhancedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/me");
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // For backward compatibility
  const profile = currentUser;

  return {
    currentUser,
    profile, // Provide profile for backward compatibility
    isLoading,
    refreshUser: fetchCurrentUser,
  };
}

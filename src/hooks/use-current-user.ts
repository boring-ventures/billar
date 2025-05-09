"use client";

import { useApiQuery } from "./use-api";
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
  const { data, isLoading, refetch } = useApiQuery<EnhancedUser | null>(
    ["currentUser"],
    "/api/me",
    {
      // Don't auto-retry on error
      // This is handled by the QueryProvider now
    }
  );

  const currentUser = data;
  // For backward compatibility
  const profile = currentUser;

  return {
    currentUser,
    profile, // Provide profile for backward compatibility
    isLoading,
    refreshUser: refetch,
  };
}

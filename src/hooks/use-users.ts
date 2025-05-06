"use client";

import { useState, useCallback } from "react";
import { User, UserFormValues } from "@/types/user";
import { useToast } from "@/components/ui/use-toast";

export function useUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(
    async (searchQuery?: string) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append("query", searchQuery);
        }

        const response = await fetch(`/api/users?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch users",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const createUser = useCallback(
    async (userData: UserFormValues) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "User created successfully",
          });
          await fetchUsers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to create user",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error creating user:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchUsers, toast]
  );

  const updateUser = useCallback(
    async (userId: string, userData: Partial<UserFormValues>) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "User updated successfully",
          });
          await fetchUsers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update user",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating user:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchUsers, toast]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "User deleted successfully",
          });
          await fetchUsers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete user",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchUsers, toast]
  );

  return {
    users,
    isLoading,
    isSubmitting,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}

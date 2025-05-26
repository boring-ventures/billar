"use client";

import { useState, useCallback } from "react";
import { User, UserFormValues } from "@/types/user";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile: currentUserProfile } = useCurrentUser();

  const fetchUsers = useCallback(
    async (searchQuery?: string) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();

        if (searchQuery) {
          queryParams.append("query", searchQuery);
        }

        // If user is not a superadmin and has a company, pass their company ID
        // This won't have any effect server-side since the API will enforce company restrictions
        // but it makes the intention clear in the frontend code
        if (
          currentUserProfile?.companyId &&
          currentUserProfile?.role !== "SUPERADMIN"
        ) {
          queryParams.append("companyId", currentUserProfile.companyId);
        }

        const response = await fetch(`/api/users?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          // Only show error toast if user is still logged in
          // This prevents showing errors during logout process
          if (currentUserProfile) {
            toast({
              title: "Error",
              description: "Error al cargar usuarios",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        // Only show error toast if user is still logged in
        if (currentUserProfile) {
          toast({
            title: "Error",
            description: "Ha ocurrido un error inesperado",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [toast, currentUserProfile]
  );

  const createUser = useCallback(
    async (userData: UserFormValues) => {
      try {
        setIsSubmitting(true);

        // If user is not a superadmin, ensure we use their company ID
        // The server will enforce this anyway, but we set it here too
        const userDataToSubmit = { ...userData };
        if (
          currentUserProfile?.companyId &&
          currentUserProfile?.role !== "SUPERADMIN"
        ) {
          userDataToSubmit.companyId = currentUserProfile.companyId;
        }

        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userDataToSubmit),
        });

        if (response.ok) {
          toast({
            title: "Usuario creado con éxito",
            description: "El usuario puede iniciar sesión inmediatamente.",
          });
          await fetchUsers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Error al crear usuario",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error creating user:", error);
        toast({
          title: "Error",
          description: "Ha ocurrido un error inesperado",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchUsers, toast, currentUserProfile]
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
            title: "Éxito",
            description: "Usuario actualizado exitosamente",
          });
          await fetchUsers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Error al actualizar usuario",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating user:", error);
        toast({
          title: "Error",
          description: "Ha ocurrido un error inesperado",
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
            title: "Éxito",
            description: "Usuario eliminado exitosamente",
          });
          await fetchUsers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Error al eliminar usuario",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error",
          description: "Ha ocurrido un error inesperado",
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

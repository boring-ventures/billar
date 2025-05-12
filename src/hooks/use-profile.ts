"use client";

import { useState, useCallback } from "react";
import { Profile } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";

export function useProfile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/profile");
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to fetch profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateProfile = useCallback(async (profileData: Partial<Profile>) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update profile",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [toast]);

  return {
    profile,
    isLoading,
    isSubmitting,
    fetchProfile,
    updateProfile,
  };
} 
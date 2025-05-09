"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Company {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  _count?: {
    profiles: number;
    tables: number;
  };
}

export function useCompanies() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCompanies = useCallback(
    async (searchQuery?: string) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append("query", searchQuery);
        }

        const response = await fetch(
          `/api/companies?${queryParams.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setCompanies(Array.isArray(data) ? data : []);
        } else {
          setCompanies([]);
          toast({
            title: "Error",
            description: "Failed to fetch companies",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompanies([]);
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

  const createCompany = useCallback(
    async (companyData: Omit<Company, "id" | "_count">) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/companies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(companyData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Company created successfully",
          });
          await fetchCompanies();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to create company",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error creating company:", error);
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
    [fetchCompanies, toast]
  );

  const updateCompany = useCallback(
    async (
      companyId: string,
      companyData: Partial<Omit<Company, "id" | "_count">>
    ) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/companies/${companyId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(companyData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Company updated successfully",
          });
          await fetchCompanies();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update company",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating company:", error);
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
    [fetchCompanies, toast]
  );

  const deleteCompany = useCallback(
    async (companyId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/companies/${companyId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Company deleted successfully",
          });
          await fetchCompanies();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete company",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting company:", error);
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
    [fetchCompanies, toast]
  );

  return {
    companies,
    isLoading,
    isSubmitting,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}

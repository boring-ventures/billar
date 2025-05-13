"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

interface Company {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

export function useCompany() {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );

  // Fetch all companies
  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    error: companiesError,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/companies");

        // Auto-select the first company if none is selected
        if (!selectedCompanyId && response.data.length > 0) {
          setSelectedCompanyId(response.data[0].id);
        }

        return response.data as Company[];
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        toast({
          title: "Error",
          description: "Failed to load companies",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Fetch selected company details
  const {
    data: selectedCompany,
    isLoading: isLoadingSelectedCompany,
    error: selectedCompanyError,
  } = useQuery({
    queryKey: ["company", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;

      try {
        const response = await axios.get(`/api/companies/${selectedCompanyId}`);
        return response.data as Company;
      } catch (error) {
        console.error("Failed to fetch selected company:", error);
        toast({
          title: "Error",
          description: "Failed to load company details",
          variant: "destructive",
        });
        return null;
      }
    },
    enabled: !!selectedCompanyId,
  });

  const selectCompany = useCallback((companyId: string) => {
    setSelectedCompanyId(companyId);
  }, []);

  return {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId: selectCompany,
    isLoading: isLoadingCompanies || isLoadingSelectedCompany,
    error: companiesError || selectedCompanyError,
    refetchCompanies,
  };
}

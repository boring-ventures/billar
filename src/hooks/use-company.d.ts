export interface Company {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

export interface UseCompanyReturn {
  companies: Company[];
  selectedCompany: Company | null;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string) => void;
  isLoading: boolean;
  error: unknown;
  refetchCompanies: () => void;
}

export function useCompany(): UseCompanyReturn;

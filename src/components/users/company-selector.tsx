"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCompanies } from "@/hooks/use-companies";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CompanySelectorProps {
  onChange?: () => void;
}

export function CompanySelector({ onChange }: CompanySelectorProps) {
  const { toast } = useToast();
  const { companies = [], isLoading, fetchCompanies } = useCompanies();
  const [open, setOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [hasFetchedCompanies, setHasFetchedCompanies] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Ensure companies is always an array of valid objects with id and name
  const companiesArray = Array.isArray(companies) 
    ? companies.filter(company => 
        company && 
        typeof company === 'object' && 
        company.id && 
        typeof company.name === 'string'
      ) 
    : [];

  // Fetch companies only once on mount
  useEffect(() => {
    if (!hasFetchedCompanies) {
      fetchCompanies();
      setHasFetchedCompanies(true);
    }
  }, [fetchCompanies, hasFetchedCompanies]);

  const handleCompanyChange = async (companyId: string) => {
    try {
      // Don't update if it's the same company
      if (companyId === selectedCompany) {
        setOpen(false);
        return;
      }
      
      setSelectedCompany(companyId);
      setOpen(false);
      
      const response = await fetch("/api/users/select-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId }),
      });

      if (response.ok) {
        toast({
          title: "Company Selected",
          description: "Successfully switched company.",
        });
        
        // Call the onChange callback if provided
        if (onChange) {
          onChange();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to select company",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error selecting company:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Fetch current user's company only once on component mount
  useEffect(() => {
    const fetchCurrentCompany = async () => {
      try {
        const response = await fetch("/api/users/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.companyId) {
            setSelectedCompany(data.companyId);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchCurrentCompany();
  }, []);

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full justify-between">
        <span>Loading companies...</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  // Safely find the selected company name
  const selectedCompanyName = selectedCompany 
    ? companiesArray.find(c => c.id === selectedCompany)?.name 
    : null;

  // If no companies are available, show a disabled button
  if (companiesArray.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-muted-foreground" />
        <Button variant="outline" disabled className="w-52 justify-between">
          <span>No companies available</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building className="h-4 w-4 text-muted-foreground" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-52 justify-between"
          >
            {selectedCompanyName ? selectedCompanyName : "Select company..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search company..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No company found.</CommandEmpty>
              <CommandGroup>
                {companiesArray
                  .filter(company => 
                    company.name.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .map((company) => (
                    <CommandItem
                      key={company.id}
                      value={company.id}
                      onSelect={() => handleCompanyChange(company.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCompany === company.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {company.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 
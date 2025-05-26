"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "@/components/users/user-table";
import { CompanyTable } from "@/components/users/company-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { profile, isLoading } = useCurrentUser();

  // Only superadmins can access companies tab
  const canAccessCompanies = profile?.role === "SUPERADMIN";

  // Default to users tab, or companies if explicitly requested and user has access
  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam === "companies" && canAccessCompanies) {
      return "companies";
    }
    return "users";
  });

  // Update the tab when URL changes or user profile loads
  useEffect(() => {
    if (tabParam === "companies" && canAccessCompanies) {
      setActiveTab("companies");
    } else {
      setActiveTab("users");
    }
  }, [tabParam, canAccessCompanies]);

  // Show loading state while fetching user profile
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // For company admins, show only user management without tabs
  if (!canAccessCompanies) {
    return (
      <div className="flex flex-col space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground">
            Administra usuarios de tu empresa.
          </p>
        </div>
        <UserTable />
      </div>
    );
  }

  // For superadmins, show the full tab system
  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Gestión de Usuarios
        </h2>
        <p className="text-muted-foreground">
          Administra usuarios y empresas en el sistema.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UserTable />
        </TabsContent>
        <TabsContent value="companies" className="mt-6">
          <CompanyTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

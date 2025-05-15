"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "@/components/users/user-table";
import { CompanyTable } from "@/components/users/company-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "companies" ? "companies" : "users"
  );

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(tabParam === "companies" ? "companies" : "users");
  }, [tabParam]);

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

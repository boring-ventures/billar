"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/tables/data-table";
import { CompanyDialog } from "../users/company-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Users, Table } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableSkeleton } from "@/components/tables/table-skeleton";
import { useCompanies } from "@/hooks/use-companies";

// Import the Company type from the custom hook file
// This is a workaround - in a real project, you would have a shared types file
type CompanyFromHook = ReturnType<typeof useCompanies>["companies"][number];

export function CompanyTable() {
  const { companies, isLoading, isSubmitting, fetchCompanies, deleteCompany } =
    useCompanies();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyFromHook | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCompanies(searchQuery);
  }, [searchQuery, fetchCompanies]);

  const handleAddEdit = (company: CompanyFromHook | null = null) => {
    setSelectedCompany(company);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedCompany) {
      const success = await deleteCompany(selectedCompany.id);
      if (success) {
        setIsDeleteAlertOpen(false);
      }
    }
  };

  // Define columns without explicit type annotation
  const columns = [
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      accessorKey: "address",
      header: "Dirección",
      cell: ({ row }: { row: { original: CompanyFromHook } }) => {
        return <div>{row.original.address || "N/A"}</div>;
      },
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }: { row: { original: CompanyFromHook } }) => {
        return <div>{row.original.phone || "N/A"}</div>;
      },
    },
    {
      id: "profiles",
      header: "Usuarios",
      cell: ({ row }: { row: { original: CompanyFromHook } }) => {
        const count = row.original._count?.profiles || 0;
        return (
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      id: "tables",
      header: "Mesas",
      cell: ({ row }: { row: { original: CompanyFromHook } }) => {
        const count = row.original._count?.tables || 0;
        return (
          <div className="flex items-center">
            <Table className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: CompanyFromHook } }) => {
        const company = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleAddEdit(company)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCompany(company);
                  setIsDeleteAlertOpen(true);
                }}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <TableSkeleton columnCount={6} />;
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={companies}
        onSearch={setSearchQuery}
        searchPlaceholder="Buscar empresas..."
        onAddNew={() => handleAddEdit()}
        addNewLabel="Añadir Empresa"
      />

      <CompanyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        company={selectedCompany}
        onSuccess={() => fetchCompanies(searchQuery)}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              empresa y se borrarán todos sus datos de nuestros servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

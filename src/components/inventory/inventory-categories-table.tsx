"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useInventoryCategoriesQuery } from "@/hooks/use-inventory-query";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/tables/data-table";
import { TableSkeleton } from "@/components/tables/table-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { InventoryCategoryDialog } from "./inventory-category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { Badge } from "@/components/ui/badge";

interface InventoryCategoriesTableProps {
  companyId?: string;
  searchQuery?: string;
  canModify?: boolean;
}

interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    name: string;
    quantity: number;
  }[];
}

export function InventoryCategoriesTable({
  companyId,
  searchQuery = "",
  canModify = false,
}: InventoryCategoriesTableProps) {
  const [editingCategory, setEditingCategory] =
    useState<InventoryCategory | null>(null);
  const [deleteCategory, setDeleteCategory] =
    useState<InventoryCategory | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  // Fetch inventory categories
  const { data: categories = [], isLoading } = useInventoryCategoriesQuery({
    companyId,
  });

  // Filter categories by search query (we'll use either the prop or the local state)
  const effectiveSearchQuery = searchQuery || localSearchQuery;
  const filteredCategories = categories.filter(
    (category) =>
      category.name
        .toLowerCase()
        .includes(effectiveSearchQuery.toLowerCase()) ||
      (category.description &&
        category.description
          .toLowerCase()
          .includes(effectiveSearchQuery.toLowerCase()))
  );

  const handleEditCategory = (category: InventoryCategory) => {
    if (canModify) {
      setEditingCategory(category);
      setShowEditDialog(true);
    }
  };

  const handleDeleteCategory = (category: InventoryCategory) => {
    if (canModify) {
      setDeleteCategory(category);
      setShowDeleteDialog(true);
    }
  };

  const handleAddNewCategory = () => {
    if (canModify) {
      setEditingCategory(null);
      setShowEditDialog(true);
    }
  };

  const handleDialogSuccess = () => {
    // Refresh the categories data
    queryClient.invalidateQueries({
      queryKey: ["inventoryCategories"],
    });
    setShowEditDialog(false);
  };

  const handleDeleteSuccess = () => {
    // Refresh the categories data
    queryClient.invalidateQueries({
      queryKey: ["inventoryCategories"],
    });
    setShowDeleteDialog(false);
  };

  const columns: ColumnDef<InventoryCategory>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return <div>{description || "-"}</div>;
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.getValue("items") as { id: string; name: string }[];
        const count = items ? items.length : 0;
        return (
          <div className="text-right">
            {count > 0 ? <Badge variant="outline">{count}</Badge> : "0"}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return <div>{new Date(date).toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const category = row.original;
        const hasItems = category.items && category.items.length > 0;

        if (!canModify) {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteCategory(category)}
                className="text-destructive focus:text-destructive"
                disabled={hasItems}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <TableSkeleton columnCount={5} />;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredCategories}
        onSearch={setLocalSearchQuery}
        searchPlaceholder="Search categories..."
        onAddNew={canModify ? handleAddNewCategory : undefined}
        addNewLabel="Add New Category"
      />

      <InventoryCategoryDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        category={editingCategory}
        companyId={companyId}
        onSuccess={handleDialogSuccess}
      />

      <DeleteCategoryDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        category={deleteCategory}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}

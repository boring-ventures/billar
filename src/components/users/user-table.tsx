"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/tables/data-table";
import { UserDialog } from "../users/user-dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useUsers } from "@/hooks/use-users";

export function UserTable() {
  const { users, isLoading, isSubmitting, fetchUsers, deleteUser } = useUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers(searchQuery);
  }, [searchQuery, fetchUsers]);

  const handleAddEdit = (user: User | null = null) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedUser) {
      const success = await deleteUser(selectedUser.id);
      if (success) {
        setIsDeleteAlertOpen(false);
      }
    }
  };

  const columns = [
    {
      accessorKey: "avatar",
      header: "",
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;
        const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`;

        return (
          <Avatar className="h-9 w-9">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt="Avatar" />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;
        return <div>{`${user.firstName || ""} ${user.lastName || ""}`}</div>;
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: { original: User } }) => {
        const role = row.original.role;
        const variant =
          role === "SUPERADMIN"
            ? "destructive"
            : role === "ADMIN"
              ? "default"
              : "outline";

        return <Badge variant={variant}>{role}</Badge>;
      },
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }: { row: { original: User } }) => {
        return <div>{row.original.company?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }: { row: { original: User } }) => {
        const isActive = row.original.active;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;

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
              <DropdownMenuItem onClick={() => handleAddEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setIsDeleteAlertOpen(true);
                }}
                className="text-destructive"
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
    return <TableSkeleton columnCount={6} />;
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={users}
        onSearch={setSearchQuery}
        searchPlaceholder="Search users..."
        onAddNew={() => handleAddEdit()}
        addNewLabel="Add User"
      />

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
        onSuccess={() => fetchUsers(searchQuery)}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

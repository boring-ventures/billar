"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Edit } from "lucide-react";
import { useCustomers } from "@/hooks/use-reservations";
import { CustomerDialog } from "./customer-dialog";

export function CustomerTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: customers = [], isLoading } = useCustomers(searchQuery);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { toast } = useToast();

  const handleSearch = () => {
    // The query will be automatically updated when searchQuery changes
    // No manual fetch needed with React Query
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="max-w-xs"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleCreateCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          New Customer
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Total Reservations</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !customers || customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.reservationCount || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        customer={selectedCustomer}
      />
    </div>
  );
}

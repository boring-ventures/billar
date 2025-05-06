"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { ItemDialog } from "./item-dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StockMovementDialog } from "./stock-movement-dialog";

export function InventoryItemTable() {
  const { items, isLoading, fetchItems } = useInventory();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStockMovementDialogOpen, setIsStockMovementDialogOpen] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems(searchQuery, showLowStockOnly);
  }, [fetchItems, searchQuery, showLowStockOnly]);

  const handleSearch = () => {
    fetchItems(searchQuery, showLowStockOnly);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setIsCreateDialogOpen(true);
  };

  const handleStockMovement = (item: any) => {
    setSelectedItem(item);
    setIsStockMovementDialogOpen(true);
  };

  const isLowStock = (item: any) => {
    return item.quantity <= item.criticalThreshold;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="max-w-xs"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="lowStock"
            checked={showLowStockOnly}
            onCheckedChange={(checked) => {
              setShowLowStockOnly(!!checked);
            }}
          />
          <label
            htmlFor="lowStock"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show low stock only
          </label>
        </div>
        <Button onClick={handleCreateItem}>
          <Plus className="h-4 w-4 mr-2" />
          New Item
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>
                <div className="flex items-center">
                  Quantity
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Critical Threshold</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className={isLowStock(item) ? "bg-red-50" : ""}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category?.name || "—"}</TableCell>
                  <TableCell>{item.sku || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {item.quantity}
                      {isLowStock(item) && (
                        <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.criticalThreshold}</TableCell>
                  <TableCell>
                    {item.price ? formatCurrency(item.price) : "—"}
                  </TableCell>
                  <TableCell>
                    {item.lastStockUpdate
                      ? formatDate(item.lastStockUpdate)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStockMovement(item)}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditItem(item)}
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

      <ItemDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        item={selectedItem}
      />

      <StockMovementDialog
        open={isStockMovementDialogOpen}
        onOpenChange={setIsStockMovementDialogOpen}
        item={selectedItem}
      />
    </div>
  );
}

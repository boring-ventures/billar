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
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  CornerRightUp,
  Exchange,
} from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { StockMovementDialog } from "./stock-movement-dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function StockMovementTable() {
  const { stockMovements, items, isLoading, fetchStockMovements, fetchItems } =
    useInventory();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStockMovements();
    fetchItems();
  }, [fetchStockMovements, fetchItems]);

  const handleCreateMovement = () => {
    setSelectedItem(null);
    setIsCreateDialogOpen(true);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "SALE":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case "ADJUSTMENT":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "RETURN":
        return <CornerRightUp className="h-4 w-4 text-amber-500" />;
      case "TRANSFER":
        return <Exchange className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getMovementBadge = (type: string) => {
    let variant: "default" | "destructive" | "outline" | "secondary" | null =
      null;

    switch (type) {
      case "PURCHASE":
        variant = "default";
        break;
      case "SALE":
        variant = "destructive";
        break;
      case "ADJUSTMENT":
        variant = "secondary";
        break;
      case "RETURN":
        variant = "outline";
        break;
      case "TRANSFER":
        variant = "secondary";
        break;
    }

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getMovementIcon(type)}
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Stock Movement History</h3>
        <Button onClick={handleCreateMovement}>
          <Plus className="h-4 w-4 mr-2" />
          New Movement
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : stockMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No stock movements found
                </TableCell>
              </TableRow>
            ) : (
              stockMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{formatDate(movement.createdAt)}</TableCell>
                  <TableCell>{movement.item?.name}</TableCell>
                  <TableCell>{getMovementBadge(movement.type)}</TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell>
                    {movement.costPrice
                      ? formatCurrency(movement.costPrice)
                      : "—"}
                  </TableCell>
                  <TableCell>{movement.reason || "—"}</TableCell>
                  <TableCell>{movement.reference || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StockMovementDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        item={selectedItem}
      />
    </div>
  );
}

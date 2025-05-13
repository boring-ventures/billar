"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { EditMovementDialog } from "./edit-movement-dialog";
import { DeleteMovementDialog } from "./delete-movement-dialog";
import { useStockMovements } from "@/hooks/use-stock-movements";

type MovementType = "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN" | "TRANSFER";

interface StockMovement {
  id: string;
  itemId: string;
  quantity: number;
  type: MovementType;
  costPrice: number | null;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  createdBy: string | null;
}

interface StockMovementTableProps {
  movements: StockMovement[];
  itemId: string;
  showAll?: boolean;
}

export function StockMovementTable({
  movements,
  itemId,
  showAll = true,
}: StockMovementTableProps) {
  const [editMovement, setEditMovement] = useState<StockMovement | null>(null);
  const [deleteMovement, setDeleteMovement] = useState<StockMovement | null>(
    null
  );
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { getMovementTypeDescription } = useStockMovements(itemId);

  const handleEditMovement = (movement: StockMovement) => {
    // Only ADJUSTMENT type movements can be edited
    if (movement.type === "ADJUSTMENT") {
      setEditMovement(movement);
      setShowEditDialog(true);
    }
  };

  const handleDeleteMovement = (movement: StockMovement) => {
    // Only ADJUSTMENT type movements can be deleted
    if (movement.type === "ADJUSTMENT") {
      setDeleteMovement(movement);
      setShowDeleteDialog(true);
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "bg-green-500/15 text-green-600";
      case "SALE":
        return "bg-blue-500/15 text-blue-600";
      case "ADJUSTMENT":
        return "bg-amber-500/15 text-amber-600";
      case "RETURN":
        return "bg-purple-500/15 text-purple-600";
      case "TRANSFER":
        return "bg-gray-500/15 text-gray-600";
      default:
        return "bg-gray-500/15 text-gray-600";
    }
  };

  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">No stock movements found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Cost Price</TableHead>
            {showAll && <TableHead>Reference</TableHead>}
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>
                {new Date(movement.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge className={getMovementTypeColor(movement.type)}>
                  {getMovementTypeDescription(movement.type)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                <span
                  className={
                    movement.type === "PURCHASE" ||
                    movement.type === "RETURN" ||
                    movement.type === "ADJUSTMENT"
                      ? "text-green-600"
                      : "text-blue-600"
                  }
                >
                  {movement.type === "PURCHASE" ||
                  movement.type === "RETURN" ||
                  movement.type === "ADJUSTMENT"
                    ? `+${movement.quantity}`
                    : `-${movement.quantity}`}
                </span>
              </TableCell>
              <TableCell>{movement.reason || "-"}</TableCell>
              <TableCell className="text-right">
                {movement.costPrice ? formatCurrency(movement.costPrice) : "-"}
              </TableCell>
              {showAll && <TableCell>{movement.reference || "-"}</TableCell>}
              <TableCell className="text-right">
                {movement.type === "ADJUSTMENT" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleEditMovement(movement)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteMovement(movement)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditMovementDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        movement={editMovement}
        onSuccess={() => setShowEditDialog(false)}
      />

      <DeleteMovementDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        movement={deleteMovement}
        onSuccess={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}

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
  ArrowLeftRight,
} from "lucide-react";
import { useInventory, InventoryItem } from "@/hooks/use-inventory";
import { StockMovementDialog } from "./stock-movement-dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StockMovement {
  id: string;
  itemId: string;
  quantity: number;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN" | "TRANSFER";
  costPrice: number | null;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  item: {
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
  quantity: number;
}

export function StockMovementTable() {
  const { stockMovements, items, isLoading, fetchStockMovements, fetchItems } =
    useInventory();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { toast } = useToast();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    itemId: "",
    quantity: 0,
    type: "PURCHASE",
    costPrice: "",
    reason: "",
    reference: "",
  });

  useEffect(() => {
    fetchStockMovements();
    fetchItems();
  }, [fetchStockMovements, fetchItems]);

  const handleCreateMovement = () => {
    setSelectedItemId(null);
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
        return <ArrowLeftRight className="h-4 w-4 text-purple-500" />;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement stock movement creation logic
    setIsDialogOpen(false);
    setFormData({
      itemId: "",
      quantity: 0,
      type: "PURCHASE",
      costPrice: "",
      reason: "",
      reference: "",
    });
  };

  const getMovementTypeIcon = (type: StockMovement["type"]) => {
    switch (type) {
      case "PURCHASE":
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case "SALE":
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "ADJUSTMENT":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "RETURN":
        return <ArrowDown className="h-4 w-4 text-yellow-500" />;
      case "TRANSFER":
        return <ArrowLeftRight className="h-4 w-4 text-purple-500" />;
    }
  };

  const getMovementTypeLabel = (type: StockMovement["type"]) => {
    switch (type) {
      case "PURCHASE":
        return "Purchase";
      case "SALE":
        return "Sale";
      case "ADJUSTMENT":
        return "Adjustment";
      case "RETURN":
        return "Return";
      case "TRANSFER":
        return "Transfer";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Stock Movement History</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Movement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock Movement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item">Product</Label>
                <Select
                  value={formData.itemId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, itemId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PURCHASE">Purchase</SelectItem>
                      <SelectItem value="SALE">Sale</SelectItem>
                      <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                      <SelectItem value="RETURN">Return</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Movement</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
        item={null}
      />
    </div>
  );
}

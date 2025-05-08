"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductGrid } from "@/components/pos/product-grid";
import { TableGrid } from "@/components/pos/table-grid";
import { usePOS } from "@/hooks/use-pos";
import { Minus, Plus, X } from "lucide-react";

export default function POSPage() {
  const [activeTab, setActiveTab] = useState("pos");
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    products,
    tables,
    currentOrder,
    selectedTable,
    loading,
    error,
    setSelectedTable,
    addToOrder,
    removeFromOrder,
    updateItemQuantity,
    calculateTotal,
    completeOrder,
    startTableSession,
  } = usePOS();

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTableSelect = async (table: any) => {
    if (table.status === "available") {
      await startTableSession(table.id);
    }
    setSelectedTable(table);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
        <p className="text-muted-foreground">
          Manage sales, orders, and table sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel - Product Selection */}
        <Card className="p-4 md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pos">POS</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pos" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ProductGrid
                  products={filteredProducts}
                  onProductSelect={addToOrder}
                />
              </div>
            </TabsContent>

            <TabsContent value="tables" className="mt-6">
              <TableGrid tables={tables} onTableSelect={handleTableSelect} />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Right Panel - Order Summary */}
        <Card className="p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Order</h3>
            {selectedTable && (
              <div className="text-sm text-muted-foreground">
                Table: {selectedTable.number}
              </div>
            )}
            <div className="space-y-2">
              {currentOrder.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateItemQuantity(
                          item.product.id,
                          Math.max(0, item.quantity - 1)
                        )
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateItemQuantity(item.product.id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromOrder(item.product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax (10%)</span>
                <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${(calculateTotal() * 1.1).toFixed(2)}</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={completeOrder}
              disabled={currentOrder.length === 0}
            >
              Complete Order
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  quantity?: number;
  sku?: string;
  companyId?: string;
  companyName?: string;
}

interface ProductGridProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

export function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        const isOutOfStock = typeof product.quantity === 'number' && product.quantity <= 0;
        
        return (
          <Card
            key={product.id}
            className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${isOutOfStock ? 'opacity-70' : ''}`}
            onClick={() => !isOutOfStock && onProductSelect(product)}
          >
            <div className="aspect-square relative mb-4">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
              
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                  <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                </div>
              )}
            </div>
            <h3 className="font-medium">{product.name}</h3>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{product.category}</p>
              {typeof product.quantity === 'number' && (
                <p className="text-xs text-muted-foreground">
                  Stock: {product.quantity}
                </p>
              )}
            </div>
            {product.sku && (
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            )}
            <p className="font-bold mt-2">${product.price.toFixed(2)}</p>
            <Button
              variant="secondary"
              className="w-full mt-2"
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                if (!isOutOfStock) {
                  onProductSelect(product);
                }
              }}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Order'}
            </Button>
          </Card>
        );
      })}
    </div>
  );
} 
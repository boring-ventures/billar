"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
}

interface ProductGridProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

export function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card
          key={product.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onProductSelect(product)}
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
          </div>
          <h3 className="font-medium">{product.name}</h3>
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <p className="font-bold mt-2">${product.price.toFixed(2)}</p>
          <Button
            variant="secondary"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onProductSelect(product);
            }}
          >
            Add to Order
          </Button>
        </Card>
      ))}
    </div>
  );
} 
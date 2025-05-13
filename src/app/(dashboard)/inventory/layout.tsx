import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Manage inventory items, categories, and stock movements",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

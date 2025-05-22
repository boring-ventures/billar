import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Inventario",
  description:
    "Administra artículos de inventario, categorías y movimientos de stock",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Punto de Venta",
  description: "Gestiona órdenes y ventas del punto de venta",
};

export default function PosLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

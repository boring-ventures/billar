import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Mesas",
  description: "Administra mesas y sesiones de mesas en el sistema",
};

export default function TablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Usuarios",
  description: "Administra usuarios y empresas en el sistema",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

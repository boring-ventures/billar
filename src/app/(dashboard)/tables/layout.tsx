import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Table Management",
  description: "Manage tables, sessions, and reservations in the system",
};

export default function TablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
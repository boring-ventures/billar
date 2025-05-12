import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Table Management",
  description: "Manage tables and table sessions in the system",
};

export default function TablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

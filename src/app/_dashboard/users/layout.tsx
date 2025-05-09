import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users and companies in the system",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

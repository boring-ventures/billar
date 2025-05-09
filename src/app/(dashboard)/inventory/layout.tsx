import { type ReactNode } from "react";

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return <div className="h-full">{children}</div>;
}

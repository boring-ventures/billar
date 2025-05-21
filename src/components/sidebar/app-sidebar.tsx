"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { sidebarData } from "./data/sidebar-data";
import { useAuth } from "@/providers/auth-provider";
import type { NavGroupProps } from "./types";
import Image from "next/image";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useAuth();

  // Filter navigation items based on user role
  const getFilteredNavGroups = () => {
    if (!profile) return [];

    // For sellers, only show specific navigation items
    if (profile.role === "SELLER") {
      return sidebarData.navGroups
        .map((group) => {
          // Filter items to only include the ones sellers should see
          const filteredItems = group.items.filter((item) =>
            [
              "Gestión de Mesas",
              "Gestión de Inventario",
              "Punto de Venta",
            ].includes(item.title)
          );

          // Return modified group with filtered items
          return {
            ...group,
            items: filteredItems,
          };
        })
        .filter((group) => group.items.length > 0); // Only include groups that have items
    }

    // For other roles (ADMIN, SUPERADMIN), show all navigation items
    return sidebarData.navGroups;
  };

  const filteredNavGroups = getFilteredNavGroups();

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-4">
          <Image
            src="/brand-assets/logo.svg"
            alt="BILLAR Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">BILLAR</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props: NavGroupProps) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

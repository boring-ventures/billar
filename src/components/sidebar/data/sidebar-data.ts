import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  Users,
  TableProperties,
  PackageOpen,
  ShoppingCart,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Billar",
      logo: Command,
      plan: "",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "User Management",
          url: "/users",
          icon: Users,
        },
        {
          title: "Table Management",
          url: "/tables",
          icon: TableProperties,
        },
        {
          title: "Inventory Management",
          url: "/inventory",
          icon: PackageOpen,
        },
        {
          title: "POS Orders",
          url: "/pos",
          icon: ShoppingCart,
        },
      ],
    },
  ],
};

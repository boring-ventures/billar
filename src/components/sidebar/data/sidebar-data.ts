import {
  Command,
  LayoutDashboard,
  Users,
  TableProperties,
  PackageOpen,
  ShoppingCart,
  BarChart,
  Receipt,
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
      name: "BILLARPRO",
      logo: Command,
      plan: "",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Panel Principal",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Gestión de Usuarios",
          url: "/users",
          icon: Users,
        },
        {
          title: "Gestión de Mesas",
          url: "/tables",
          icon: TableProperties,
        },
        {
          title: "Gestión de Inventario",
          url: "/inventory",
          icon: PackageOpen,
        },
        {
          title: "Punto de Venta",
          url: "/pos",
          icon: ShoppingCart,
        },
        {
          title: "Gastos",
          url: "/gastos",
          icon: Receipt,
        },
        {
          title: "Reportes Financieros",
          url: "/reports",
          icon: BarChart,
        },
      ],
    },
  ],
};

import {
  AlertCircle,
  AppWindow,
  AudioWaveform,
  Ban,
  Bug,
  CheckSquare,
  Command,
  GalleryVerticalEnd,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LockKeyhole,
  MessageSquare,
  Settings,
  ServerCrash,
  UserX,
  Users,
  TableProperties,
  Calendar,
  Package,
  Receipt,
  DollarSign,
  Wrench,
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
      name: "Shadcn Admin",
      logo: Command,
      plan: "Vite + ShadcnUI",
    },
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
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
          title: "Financial",
          icon: DollarSign,
          items: [
            {
              title: "Overview",
              url: "/financial",
              icon: LayoutDashboard,
            },
            {
              title: "Income",
              url: "/financial/income",
              icon: DollarSign,
            },
            {
              title: "Expenses",
              url: "/financial/expenses",
              icon: Receipt,
            },
            {
              title: "Reports",
              url: "/financial/reports",
              icon: CheckSquare,
            },
          ],
        },
        {
          title: "Point of Sale",
          url: "/inventory/pos",
          icon: Receipt,
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
          title: "Maintenance",
          icon: Wrench,
          items: [
            {
              title: "Overview",
              url: "/maintenance",
              icon: LayoutDashboard,
            },
            {
              title: "Schedule",
              url: "/maintenance/schedule",
              icon: Calendar,
            },
            {
              title: "Records",
              url: "/maintenance/records",
              icon: CheckSquare,
            },
            {
              title: "Costs",
              url: "/maintenance/costs",
              icon: DollarSign,
            },
          ],
        },
        {
          title: "Reservations",
          url: "/reservations",
          icon: Calendar,
        },
        {
          title: "Inventory",
          url: "/inventory",
          icon: Package,
        },
      ],
    },
    {
      title: "Other",
      items: [
        {
          title: "Settings",
          icon: Settings,
          url: "/settings",
        },
        {
          title: "Help Center",
          url: "/help-center",
          icon: HelpCircle,
        },
      ],
    },
  ],
};

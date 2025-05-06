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
          url: "/",
          icon: LayoutDashboard,
        },
        {
          title: "Tasks",
          url: "/tasks",
          icon: CheckSquare,
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
          title: "Reservations",
          url: "/reservations",
          icon: Calendar,
        },
        {
          title: "Apps",
          url: "/apps",
          icon: AppWindow,
        },
        {
          title: "Chats",
          url: "/chats",
          badge: "3",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "Pages",
      items: [
        {
          title: "Auth",
          icon: Lock,
          items: [
            {
              title: "Sign In",
              url: "/sign-in",
            },
            {
              title: "Sign In (2 Col)",
              url: "/sign-in-2",
            },
            {
              title: "Sign Up",
              url: "/sign-up",
            },
            {
              title: "Forgot Password",
              url: "/forgot-password",
            },
            {
              title: "OTP",
              url: "/otp",
            },
          ],
        },
        {
          title: "Errors",
          icon: Bug,
          items: [
            {
              title: "Unauthorized",
              url: "/401",
              icon: LockKeyhole,
            },
            {
              title: "Forbidden",
              url: "/403",
              icon: UserX,
            },
            {
              title: "Not Found",
              url: "/404",
              icon: AlertCircle,
            },
            {
              title: "Internal Server Error",
              url: "/500",
              icon: ServerCrash,
            },
            {
              title: "Maintenance Error",
              url: "/503",
              icon: Ban,
            },
          ],
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

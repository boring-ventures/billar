import { UserRole } from "@prisma/client";

export type UserRoleType = "SELLER" | "ADMIN" | "SUPERADMIN";

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email?: string;
  role: UserRole | UserRoleType;
  companyId: string | null;
  active: boolean;
  avatarUrl?: string | null;
  company?: {
    name: string;
  } | null;
}

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  role: UserRoleType;
  companyId: string | null;
  active: boolean;
}

import { UserRole } from "@prisma/client";

// Create a client-side version of UserRole to avoid importing from Prisma in the browser
export enum UserRoleEnum {
  SELLER = "SELLER",
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN"
}

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

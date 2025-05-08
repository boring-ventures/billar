import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

// Mock session for testing purposes
const mockSession = {
  user: {
    id: "superadmin",
    email: "superadmin@example.com",
    name: "Superadmin",
    role: "SUPERADMIN",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
};

export async function auth() {
  // For testing purposes, always return the mock session
  return mockSession;
} 
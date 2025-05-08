// This file implements authentication middleware for API routes
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import prisma from './prisma';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

interface Session {
  user: User;
  expires: Date;
}

// Auth function for checking session and getting current user
export async function auth(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    // Get session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth error:', error);
      return null;
    }
    
    if (!session) {
      return null;
    }
    
    // Return session in expected format
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name,
        role: session.user.user_metadata?.role || 'SELLER',
      },
      expires: new Date((session.expires_at || Math.floor(Date.now()/1000) + 86400) * 1000),
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Function to get the current user (useful for client components)
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  return session?.user || null;
}

// Auth middleware for API routes - following the pattern from Logic Tasks.txt
export async function authenticateRequest(req: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user) {
    throw {
      status: 401,
      message: "Unauthorized",
    };
  }
  
  // Get user profile from database
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { company: true },
  });
  
  if (!profile) {
    throw {
      status: 404,
      message: "Profile not found",
    };
  }
  
  // Determine role properly
  // First check metadata (from session) to see if the user is a SUPERADMIN
  const sessionRole = (session.user.role || '').toString().toUpperCase();
  const dbRole = (profile.role || 'SELLER').toString().toUpperCase();
  
  let effectiveRole = dbRole;
  
  // Promote to SUPERADMIN if either session or db profile indicates it
  if (sessionRole === 'SUPERADMIN' || dbRole === 'SUPERADMIN') {
    effectiveRole = 'SUPERADMIN';
  }
  
  // Return enhanced profile with properly resolved role
  return {
    ...profile,
    role: effectiveRole
  };
}

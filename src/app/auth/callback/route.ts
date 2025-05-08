import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        // Redirect to error page with error message
        return NextResponse.redirect(
          new URL(`/auth-error?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      // Create user profile in Prisma if it doesn't exist and we have a session
      if (data?.session) {
        const userId = data.session.user.id;

        try {
          const existingProfile = await prisma.profile.findUnique({
            where: { userId },
          });

          if (!existingProfile) {
            console.log("Creating new profile for user:", userId);
            const newProfile = await prisma.profile.create({
              data: {
                userId,
                role: UserRole.SELLER,
              },
            });
            console.log("Profile created successfully:", newProfile.id);
          } else {
            console.log("Profile already exists for user:", userId);
          }
        } catch (profileError) {
          console.error("Error creating/checking profile:", profileError);
          // Continue to dashboard even if profile creation fails
          // The user will see an error there and can contact support
        }
      } else {
        console.error("No session data after code exchange");
      }
    } catch (error) {
      console.error("Unexpected error in auth callback:", error);
      return NextResponse.redirect(
        new URL(`/auth-error?error=${encodeURIComponent("Unexpected authentication error")}`, request.url)
      );
    }
  } else {
    console.error("No code parameter provided in callback URL");
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

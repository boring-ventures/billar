import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// PUT: Update user password
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user email from session
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      );
    }

    // First verify the current password by signing in with the already hashed password
    // We add the x-password-hashed header to tell Supabase the password is already hashed
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      // Only modify Supabase auth endpoints for sign in
      const url = input instanceof Request ? input.url : input.toString();
      const isSignInEndpoint = url.includes("/auth/v1/token");

      if (isSignInEndpoint && init?.body) {
        init = {
          ...init,
          headers: {
            ...(init?.headers || {}),
            "x-password-hashed": "true",
          },
        };
      }

      return originalFetch(input, init);
    };

    // Verify the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword, // Already hashed from the client
    });

    // Restore original fetch
    globalThis.fetch = originalFetch;

    if (signInError) {
      console.error("Sign in error:", signInError);
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Set the x-password-hashed header for the updateUser call
    globalThis.fetch = async (input, init) => {
      // Only modify Supabase auth endpoints for password update
      const url = input instanceof Request ? input.url : input.toString();
      const isUpdateUserEndpoint = url.includes("/auth/v1/user");

      if (isUpdateUserEndpoint && init?.body) {
        init = {
          ...init,
          headers: {
            ...(init?.headers || {}),
            "x-password-hashed": "true",
          },
        };
      }

      return originalFetch(input, init);
    };

    // Update the password using Supabase Auth API
    const { error } = await supabase.auth.updateUser({
      password: newPassword, // Already hashed from the client
    });

    // Restore original fetch again
    globalThis.fetch = originalFetch;

    if (error) {
      console.error("Password update error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}

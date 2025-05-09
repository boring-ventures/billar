import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up/components/sign-up-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <Card className="p-6 border border-primary/30 shadow-md bg-card rounded-lg">
        <div className="mb-2 flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to create an account. <br />
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Sign In
            </Link>
          </p>
        </div>
        <SignUpForm />
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </Card>
    </AuthLayout>
  );
}

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
      <Card className="p-6 border border-slate-700 shadow-md bg-black rounded-lg">
        <div className="mb-2 flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Create an account
          </h1>
          <p className="text-sm text-slate-300">
            Enter your email and password to create an account. <br />
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
            >
              Sign In
            </Link>
          </p>
        </div>
        <SignUpForm />
        <p className="mt-4 px-8 text-center text-sm text-slate-300">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms"
            className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </Card>
    </AuthLayout>
  );
}

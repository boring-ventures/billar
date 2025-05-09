import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { UserAuthForm } from "@/components/auth/sign-in/components/user-auth-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <Card className="p-6 border border-slate-700 shadow-md bg-black rounded-lg">
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Login</h1>
          <p className="text-sm text-slate-300">
            Enter your email and password below <br />
            to log into your account.{" "}
            <Link
              href="/sign-up"
              className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
            >
              Don&apos;t have an account?
            </Link>
          </p>
        </div>
        <UserAuthForm />
        <div className="mt-4 text-center text-sm">
          <p className="text-slate-300">
            Prefer to sign in without a password?{" "}
            <Link
              href="/magic-link"
              className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
            >
              Sign in with a magic link
            </Link>
          </p>
        </div>
        <p className="mt-4 px-8 text-center text-sm text-slate-300">
          By clicking login, you agree to our{" "}
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

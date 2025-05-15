import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up/components/sign-up-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Registrarse",
  description: "Crear una nueva cuenta",
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="mb-2 flex flex-col space-y-2 text-left">
          <h1 className="text-lg font-semibold tracking-tight">
            Crear una cuenta
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu correo y contraseña para crear una cuenta. <br />
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              Iniciar Sesión
            </Link>
          </p>
        </div>
        <SignUpForm />
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
          Al crear una cuenta, aceptas nuestros{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Política de Privacidad
          </Link>
          .
        </p>
      </Card>
    </AuthLayout>
  );
}

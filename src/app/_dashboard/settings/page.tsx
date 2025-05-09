"use client";

import { useState, useEffect } from "react";
import { SettingsForm } from "./components/settings-form";
import { PasswordDialog } from "./components/password-dialog";
import { AccountSection } from "./components/account-section";
import { SettingsLoader } from "./components/settings-loader";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { LockKeyhole, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { profile, isLoading, refetch } = useCurrentUser();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);

  // Simulate data loading and ensure everything is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        setPageLoading(false);
      }
    }, 500); // Small delay to ensure smooth transitions

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleRetry = async () => {
    setRetryLoading(true);
    if (refetch) {
      await refetch();
      setTimeout(() => setRetryLoading(false), 500);
    } else {
      setRetryLoading(false);
    }
  };

  // Handle error case
  if (!isLoading && !profile) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              No se pudo cargar el perfil
            </CardTitle>
            <CardDescription>
              No se pudo cargar la información de tu perfil. Por favor, intenta
              nuevamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={handleRetry}
              className="w-full max-w-xs"
              disabled={retryLoading}
            >
              {retryLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Reintentar"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loader while loading
  if (pageLoading || isLoading) {
    return <SettingsLoader />;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">
          Gestiona tu configuración de cuenta y preferencias.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <AccountSection />
          <SettingsForm />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Gestiona la configuración de seguridad de tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Contraseña</h3>
                <p className="text-sm text-muted-foreground">
                  Actualiza tu contraseña regularmente para mayor seguridad.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setPasswordDialogOpen(true)}
                className="flex items-center"
              >
                <LockKeyhole className="mr-2 h-4 w-4" />
                Cambiar Contraseña
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  );
}

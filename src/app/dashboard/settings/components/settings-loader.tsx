"use client";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(30);
    }, 200);

    const timer2 = setTimeout(() => {
      setProgress(60);
    }, 600);

    const timer3 = setTimeout(() => {
      setProgress(90);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" disabled>
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" disabled>
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Account Section Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings Form Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full rounded-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
        <div className="flex flex-col items-center gap-4 w-full max-w-sm p-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-base font-medium">Cargando configuración...</p>
          <Progress value={progress} className="w-full h-2" />
        </div>
      </div>
    </div>
  );
}

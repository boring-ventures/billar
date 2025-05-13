"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function ItemDetailsSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-[100px]" />
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[90px]" />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <Skeleton className="h-6 w-[150px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[300px]" />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-[80px] mb-2" />
              <Skeleton className="h-5 w-[120px]" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="movements" className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="movements" className="flex-1">
            <Skeleton className="h-4 w-[120px]" />
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex-1">
            <Skeleton className="h-4 w-[100px]" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="movements" className="mt-6">
          <div className="flex justify-end mb-4">
            <Skeleton className="h-9 w-[150px]" />
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-[120px]" />
                  <Skeleton className="h-6 w-[90px]" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between py-2">
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-5 w-[120px]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TableDetailsSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-[120px]" />
        </div>
      </div>

      {/* Table Details Card Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <Skeleton className="h-6 w-[120px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[180px]" />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(5)
            .fill(null)
            .map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div>
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="sessions" disabled>
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
            <TabsTrigger value="activity" disabled>
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
            <TabsTrigger value="reservations" disabled>
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
            <TabsTrigger value="maintenance" disabled>
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sessions" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {Array(3)
                  .fill(null)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="py-4 border-b last:border-b-0 space-y-2"
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-[70px] rounded-full" />
                          <Skeleton className="h-5 w-[120px]" />
                        </div>
                        <Skeleton className="h-8 w-[100px]" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

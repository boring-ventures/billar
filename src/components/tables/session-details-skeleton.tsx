import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, DollarSign, User, ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function SessionDetailsSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[140px]" />
        </div>
      </div>

      {/* Alert - Optional */}
      <Skeleton className="h-16 w-full rounded-md" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Duration Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-[120px] mb-2" />
            <Skeleton className="h-4 w-[180px] mb-1" />
            <Skeleton className="h-4 w-[180px]" />
          </CardContent>
        </Card>

        {/* Cost Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-[100px] mb-2" />
            <Skeleton className="h-4 w-[160px]" />
          </CardContent>
        </Card>

        {/* Staff Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-[180px]" />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Orders Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Orders
        </h3>

        {/* Orders Skeleton */}
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
                    <Skeleton className="h-5 w-[180px]" />
                    <Skeleton className="h-5 w-[80px]" />
                  </div>
                  <div className="flex justify-between mt-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-6 w-[100px]" />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

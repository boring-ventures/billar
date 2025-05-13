import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function SessionOrdersListSkeleton() {
  return (
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
  );
}

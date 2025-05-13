import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TableSessionsSkeleton() {
  return (
    <div className="space-y-4">
      {Array(3)
        .fill(null)
        .map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-[70px] rounded-full" />
                  <Skeleton className="h-5 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-[100px]" />
              </div>
              <Skeleton className="h-4 w-[180px] mt-1" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Skeleton className="h-4 w-[60px] mb-1" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
                <div>
                  <Skeleton className="h-4 w-[30px] mb-1" />
                  <Skeleton className="h-5 w-[60px]" />
                </div>
                <div>
                  <Skeleton className="h-4 w-[40px] mb-1" />
                  <Skeleton className="h-5 w-[120px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

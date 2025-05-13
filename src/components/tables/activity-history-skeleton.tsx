import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityHistorySkeleton() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <div key={index} className="relative pl-8">
                  {/* Timeline connector */}
                  {index < 4 && (
                    <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
                  )}

                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 h-6 w-6 rounded-full border border-border bg-background flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[180px] mb-2" />

                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-[80px] rounded-full" />
                      <span>→</span>
                      <Skeleton className="h-5 w-[80px] rounded-full" />
                    </div>

                    <Skeleton className="h-4 w-full max-w-[300px] mt-1" />
                    <Skeleton className="h-4 w-[140px] mt-1" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

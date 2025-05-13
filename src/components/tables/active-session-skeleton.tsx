import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Timer } from "lucide-react";

export function ActiveSessionSkeleton() {
  return (
    <Card className="overflow-hidden border-2 border-red-500 bg-red-50 mb-6">
      <CardHeader className="pb-3 bg-red-100 border-b border-red-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-[120px] rounded-full bg-red-200" />
              <Skeleton className="h-6 w-[180px] bg-red-200" />
            </div>
            <Skeleton className="h-4 w-[200px] mt-1 bg-red-200" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-[100px] bg-red-200" />
            <Skeleton className="h-9 w-[100px] bg-red-200" />
            <Skeleton className="h-9 w-[100px] bg-red-200" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-4">
        <Alert className="mb-4 bg-red-100 border-red-200 text-red-800">
          <Timer className="h-4 w-4" />
          <AlertTitle>Ongoing Session</AlertTitle>
          <AlertDescription>
            This table is currently in use. The timer is running and charges are
            accruing.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current Duration
            </p>
            <Skeleton className="h-7 w-[120px] mt-1 bg-red-200" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Approx. Cost
            </p>
            <Skeleton className="h-7 w-[80px] mt-1 bg-red-200" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Staff</p>
            <Skeleton className="h-6 w-[140px] mt-1 bg-red-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

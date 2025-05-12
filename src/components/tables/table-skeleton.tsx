import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columnCount: number;
}

export function TableSkeleton({ columnCount }: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="rounded-md border">
        <div className="h-12 border-b px-4 bg-muted/30">
          <div className="flex items-center h-full">
            {Array(columnCount)
              .fill(null)
              .map((_, index) => (
                <div key={index} className="flex-1">
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
          </div>
        </div>

        {Array(5)
          .fill(null)
          .map((_, rowIndex) => (
            <div key={rowIndex} className="h-16 border-b px-4 py-2">
              <div className="flex items-center h-full">
                {Array(columnCount)
                  .fill(null)
                  .map((_, colIndex) => (
                    <div key={colIndex} className="flex-1">
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[250px]" />
      </div>
    </div>
  );
}

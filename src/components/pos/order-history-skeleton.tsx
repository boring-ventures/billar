import { Skeleton } from "@/components/ui/skeleton";

export function OrderHistorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded-full" /> {/* Icon */}
          <Skeleton className="h-7 w-48" /> {/* Title */}
        </div>
        <Skeleton className="h-4 w-60" /> {/* Description */}
      </div>

      {/* Filters row */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <Skeleton className="h-10 w-full md:w-[180px]" /> {/* Company filter */}
        <Skeleton className="h-10 w-full md:w-[200px]" /> {/* Date filter */}
        <Skeleton className="h-10 w-full md:w-[180px]" /> {/* Status filter */}
        <Skeleton className="h-10 w-full md:w-[100px]" /> {/* Clear button */}
      </div>

      {/* Search/Controls row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" /> {/* Search */}
        <Skeleton className="h-10 w-[120px]" /> {/* Additional controls */}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {/* Table header */}
        <div className="h-12 border-b px-4 bg-muted/30">
          <div className="flex items-center h-full">
            {Array(8) // 8 columns for the orders table
              .fill(null)
              .map((_, index) => (
                <div key={index} className="flex-1">
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
          </div>
        </div>

        {/* Table rows */}
        {Array(6)
          .fill(null)
          .map((_, rowIndex) => (
            <div key={rowIndex} className="h-16 border-b px-4 py-2">
              <div className="flex items-center h-full">
                {Array(8)
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[250px]" />
      </div>
    </div>
  );
}

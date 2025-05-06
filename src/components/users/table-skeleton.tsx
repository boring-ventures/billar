"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

export function TableSkeleton({
  columnCount,
  rowCount = 5,
}: TableSkeletonProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array(columnCount)
                .fill(null)
                .map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-6 w-full max-w-[100px]" />
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(rowCount)
              .fill(null)
              .map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array(columnCount)
                    .fill(null)
                    .map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
    </div>
  );
}

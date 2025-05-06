"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TablesListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Hourly Rate</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-[120px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-[100px]" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-5 w-[80px]" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TableDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[130px]" />
          <Skeleton className="h-9 w-[110px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6">
          <Skeleton className="h-6 w-[140px] mb-2" />
          <Skeleton className="h-4 w-[180px] mb-6" />

          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-[80px] mb-2" />
              <Skeleton className="h-6 w-[100px]" />
            </div>

            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-7 w-[120px]" />
            </div>

            <div>
              <Skeleton className="h-4 w-[70px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </div>

            <Skeleton className="h-px w-full my-4" />

            <div>
              <Skeleton className="h-5 w-[140px] mb-3" />
              <Skeleton className="h-9 w-full mb-3" />
              <Skeleton className="h-20 w-full mb-3" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="mb-4">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          <div className="border rounded-md p-6">
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[250px] mb-6" />

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border-b pb-3">
                  <div className="flex justify-between mb-2">
                    <div>
                      <Skeleton className="h-5 w-[250px] mb-2" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

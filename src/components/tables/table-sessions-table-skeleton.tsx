import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TableSessionsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[180px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[70px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[100px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[100px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[60px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[30px]" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(null)
              .map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell>
                    <Skeleton className="h-6 w-full max-w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[70px] rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-full max-w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-full max-w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-full max-w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-full max-w-[70px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-full max-w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
    </div>
  );
}

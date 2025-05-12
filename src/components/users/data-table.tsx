"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps {
  columns: {
    header: string;
    accessorKey: string;
  }[];
  data: any[];
}

export function DataTable({ columns, data }: DataTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.accessorKey}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={row.id || i}>
            {columns.map((column) => (
              <TableCell key={`${row.id || i}-${column.accessorKey}`}>
                {typeof row[column.accessorKey] === 'object' 
                  ? JSON.stringify(row[column.accessorKey])
                  : row[column.accessorKey]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
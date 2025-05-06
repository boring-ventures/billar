"use client";

import { TableStatus } from "@prisma/client";
import { Check, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TABLE_STATUS_LABELS, TABLE_STATUS_COLORS } from "@/types/table";

interface TableStatusFilterProps {
  value: TableStatus | null;
  onChange: (status: TableStatus | null) => void;
}

export function TableStatusFilter({ value, onChange }: TableStatusFilterProps) {
  const statuses: TableStatus[] = [
    "AVAILABLE",
    "OCCUPIED",
    "RESERVED",
    "MAINTENANCE",
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto justify-between">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            {value ? (
              <>
                Status:
                <Badge
                  variant="outline"
                  className={cn("ml-2", TABLE_STATUS_COLORS[value])}
                >
                  {TABLE_STATUS_LABELS[value]}
                </Badge>
              </>
            ) : (
              "Filter by Status"
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {statuses.map((status) => (
            <DropdownMenuItem
              key={status}
              className="flex items-center justify-between cursor-pointer"
              onClick={() => onChange(status === value ? null : status)}
            >
              <div className="flex items-center">
                <Badge
                  variant="outline"
                  className={cn("mr-2", TABLE_STATUS_COLORS[status])}
                >
                  {TABLE_STATUS_LABELS[status]}
                </Badge>
              </div>
              {value === status && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          {value && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-between cursor-pointer"
                onClick={() => onChange(null)}
              >
                Clear Filter
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

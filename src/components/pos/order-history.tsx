"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/hooks/use-company";
import { usePosOrdersQuery } from "@/hooks/use-pos-orders-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Eye, Search, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDetailsDialog } from "@/components/pos/order-details-dialog";
import { useQueryClient } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { OrderHistorySkeleton } from "./order-history-skeleton";

// Define the structure of an order for column typing
interface Order {
  id: string;
  createdAt: string;
  company?: {
    id: string;
    name: string;
  };
  tableSession?: {
    id: string;
    table: {
      id: string;
      name: string;
    };
  };
  amount: number;
  paymentMethod: "CASH" | "QR" | "CREDIT_CARD";
  paymentStatus: "PAID" | "UNPAID";
}

export function OrderHistory() {
  const queryClient = useQueryClient();
  const { companies, selectedCompany } = useCompany();
  const [filterByCompany, setFilterByCompany] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | undefined
  >(undefined);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  // Use the selected company if filter is enabled, otherwise fetch all orders
  const companyIdFilter = filterByCompany ? selectedCompanyId : undefined;

  // Initialize hook with filters to fetch all orders by default
  const {
    orders,
    pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    getPaymentMethodText,
    getPaymentStatusText,
    // Pagination methods
    nextPage,
    prevPage,
  } = usePosOrdersQuery({
    companyId: companyIdFilter || "", // Pass empty string instead of undefined
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
    page: 1,
    limit: 50, // Default page size
  });

  // Set the selected company ID when it changes
  useEffect(() => {
    if (selectedCompany) {
      setSelectedCompanyId(selectedCompany.id);
    }
  }, [selectedCompany]);

  // Force refresh orders when filters change
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["posOrders"] });
  }, [companyIdFilter, filterByCompany, queryClient]);

  // Update date filter when date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    updateFilters({
      dateFrom: range?.from?.toISOString(),
      dateTo: range?.to?.toISOString(),
      page: 1, // Reset to first page when filter changes
    });
  };

  // Filter orders by payment status
  const handleStatusChange = (status: string) => {
    if (status === "ALL") {
      updateFilters({
        paymentStatus: undefined,
        page: 1, // Reset to first page when filter changes
      });
    } else {
      updateFilters({
        paymentStatus: status as "PAID" | "UNPAID",
        page: 1, // Reset to first page when filter changes
      });
    }
  };

  // Filter orders by company
  const handleCompanyChange = (companyId: string) => {
    if (companyId === "ALL") {
      setFilterByCompany(false);
      updateFilters({
        companyId: "",
        page: 1,
      });
    } else {
      setFilterByCompany(true);
      setSelectedCompanyId(companyId);
      updateFilters({
        companyId: companyId,
        page: 1,
      });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    resetFilters();
    setDateRange({ from: undefined, to: undefined });
    setSearchTerm("");
    setFilterByCompany(false);
    updateFilters({
      companyId: "",
      page: 1,
    });
  };

  // Filter orders by search term (locally)
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;

    const termLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(termLower) ||
      order.tableSession?.table.name.toLowerCase().includes(termLower) ||
      order.company?.name.toLowerCase().includes(termLower) ||
      false
    );
  });

  // Open order details dialog
  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDetailsOpen(true);
  };

  // Define table columns
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.id.substring(0, 8)}...</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div>{format(new Date(row.original.createdAt), "MMM dd, yyyy p")}</div>
      ),
    },
    {
      accessorKey: "company.name",
      header: "Company",
      cell: ({ row }) => <div>{row.original.company?.name || "-"}</div>,
    },
    {
      accessorKey: "tableSession.table.name",
      header: "Table",
      cell: ({ row }) => (
        <div>
          {row.original.tableSession
            ? row.original.tableSession.table.name
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <div>${Number(row.original.amount).toFixed(2)}</div>,
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment",
      cell: ({ row }) => (
        <div>{getPaymentMethodText(row.original.paymentMethod)}</div>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        return (
          <Badge
            variant={status === "PAID" ? "outline" : "secondary"}
            className={status === "PAID" ? "bg-green-100 text-green-800" : ""}
          >
            {getPaymentStatusText(status)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleViewDetails(row.original.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // Status filter component to pass to DataTable
  const statusFilterElement = (
    <Select
      value={filters.paymentStatus || "ALL"}
      onValueChange={handleStatusChange}
    >
      <SelectTrigger className="w-full md:w-[180px]">
        <SelectValue placeholder="Payment Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Statuses</SelectItem>
        <SelectItem value="PAID">Paid</SelectItem>
        <SelectItem value="UNPAID">Unpaid</SelectItem>
      </SelectContent>
    </Select>
  );

  // Filter row elements
  const filterRow = (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
      {/* Company Filter */}
      <Select
        onValueChange={handleCompanyChange}
        defaultValue={filterByCompany ? selectedCompanyId : "ALL"}
        value={filterByCompany ? selectedCompanyId : "ALL"}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Select Company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Companies</SelectItem>
          {companies.map((company: { id: string; name: string }) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full md:w-[200px] justify-start text-left font-normal",
              !dateRange?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {statusFilterElement}

      {/* Clear Filters */}
      <Button
        variant="outline"
        onClick={handleClearFilters}
        className="w-full md:w-auto"
      >
        <X className="mr-2 h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  );

  // Render content based on loading state
  const renderContent = () => {
    if (isLoading) {
      return <OrderHistorySkeleton />;
    }

    if (error) {
      return <div className="text-red-500 py-4">{error}</div>;
    }

    return (
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <h3 className="text-xl font-semibold tracking-tight">
              Orders History
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length} orders found
            {pagination && (
              <span className="ml-2">
                (Page {pagination.page} of {pagination.totalPages}, Total:{" "}
                {pagination.total})
              </span>
            )}
          </p>
        </div>

        {filterRow}
        <DataTable
          columns={columns}
          data={filteredOrders}
          onSearch={setSearchTerm}
          searchPlaceholder="Search orders..."
        />
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      {/* Order Details Dialog */}
      {selectedOrderId && (
        <OrderDetailsDialog
          orderId={selectedOrderId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
    </>
  );
}

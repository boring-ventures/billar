"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/hooks/use-company";
import { usePosOrdersQuery } from "@/hooks/use-pos-orders-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDetailsDialog } from "@/components/pos/order-details-dialog";
import { useQueryClient } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";

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
    goToPage,
    setPageSize,
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
    console.log("Invalidating posOrders query with filters:", {
      companyId: companyIdFilter,
      filterByCompany,
    });
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
      false ||
      order.company?.name.toLowerCase().includes(termLower) ||
      false
    );
  });

  // Open order details dialog
  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Order Filters</CardTitle>
          <CardDescription>
            Filter orders by company, date, status, or search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Company Filter */}
            <Select
              onValueChange={handleCompanyChange}
              defaultValue={filterByCompany ? selectedCompanyId : "ALL"}
              value={filterByCompany ? selectedCompanyId : "ALL"}
            >
              <SelectTrigger>
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
                    "justify-start text-left font-normal",
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

            {/* Status Filter */}
            <Select
              onValueChange={handleStatusChange}
              defaultValue={filters.paymentStatus || "ALL"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search orders..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              {filteredOrders.length} orders found
              {pagination && (
                <span className="ml-2">
                  (Page {pagination.page} of {pagination.totalPages}, Total:{" "}
                  {pagination.total})
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading orders...</div>
          ) : error ? (
            <div className="text-red-500 py-4">{error}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found matching your criteria
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "MMM dd, yyyy p")}
                      </TableCell>
                      <TableCell>{order.company?.name || "-"}</TableCell>
                      <TableCell>
                        {order.tableSession
                          ? order.tableSession.table.name
                          : "-"}
                      </TableCell>
                      <TableCell>${Number(order.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {getPaymentMethodText(order.paymentMethod)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.paymentStatus === "PAID"
                              ? "outline"
                              : "secondary"
                          }
                          className={
                            order.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {getPaymentStatusText(order.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevPage}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextPage}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrderId && (
        <OrderDetailsDialog
          orderId={selectedOrderId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
    </div>
  );
}

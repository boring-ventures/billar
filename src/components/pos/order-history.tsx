"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/hooks/use-company";
import { usePosOrdersQuery } from "@/hooks/use-pos-orders-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Eye,
  X,
  MoreHorizontal,
  Printer,
  FileText,
  RefreshCw,
  Download,
  FilePlus,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDetailsDialog } from "@/components/pos/order-details-dialog";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { OrderHistorySkeleton } from "./order-history-skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

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
    totalCost?: number | null;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
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
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false);
  const [isPrintPdfDialogOpen, setIsPrintPdfDialogOpen] = useState(false);
  const [isExportAllDialogOpen, setIsExportAllDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if there's an order to view from URL parameters
  useEffect(() => {
    const viewOrderId = searchParams.get("viewOrder");
    if (viewOrderId) {
      // Open the order details dialog for this order
      setSelectedOrderId(viewOrderId);
      setIsDetailsOpen(true);

      // Remove the query parameter to avoid reopening on refresh
      // This creates a new URL without the viewOrder parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("viewOrder");

      // Update browser history without reloading the page
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  // Use the selected company if filter is enabled, otherwise fetch all orders
  const companyIdFilter = filterByCompany ? selectedCompanyId : undefined;

  // Initialize hook with filters to fetch all orders by default
  const {
    orders,
    pagination,
    isLoading,
    filters,
    updateFilters,
    resetFilters,
    getPaymentMethodText,
    getPaymentStatusText,
    updateOrder,
  } = usePosOrdersQuery({
    companyId: companyIdFilter || "", // Pass empty string instead of undefined
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
    page: 1,
    limit: 50, // Default page size
  });

  // Get the isFetching state for the posOrders query
  const ordersIsFetching = useIsFetching({ queryKey: ["posOrders"] }) > 0;

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

  // Handle creating new order
  const handleCreateNewOrder = () => {
    // Switch to the "new" tab in the POS page
    router.push("/pos?tab=new");
  };

  // Handle refreshing data by invalidating the query cache
  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient
      .invalidateQueries({
        queryKey: ["posOrders"],
        refetchType: "active",
      })
      .then(() => {
        setIsRefreshing(false);
        toast({
          title: "Datos Actualizados",
          description: "Los datos de órdenes han sido actualizados",
        });
      });
  };

  // Handle print invoice
  const handlePrint = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsPrintDialogOpen(true);
  };

  // Perform print invoice action
  const performPrint = () => {
    // In a real app, this would trigger a print API call or open a print dialog
    toast({
      title: "Imprimiendo Factura",
      description: `Imprimiendo factura para orden #${selectedOrderId?.substring(0, 8)}`,
    });
    setIsPrintDialogOpen(false);
  };

  // Handle print PDF
  const handlePrintPdf = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsPrintPdfDialogOpen(true);
  };

  // Perform print PDF action
  const performPrintPdf = () => {
    // In a real app, this would generate and print a PDF
    toast({
      title: "Imprimiendo PDF",
      description: `Imprimiendo PDF para orden #${selectedOrderId?.substring(0, 8)}`,
    });
    setIsPrintPdfDialogOpen(false);
  };

  // Handle export order
  const handleExport = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsExportDialogOpen(true);
  };

  // Perform export action
  const performExport = () => {
    // In a real app, this would generate and download a file
    toast({
      title: "Orden Exportada",
      description: `Orden #${selectedOrderId?.substring(0, 8)} ha sido exportada a PDF`,
    });
    setIsExportDialogOpen(false);
  };

  // Handle export all orders
  const handleExportAll = () => {
    setIsExportAllDialogOpen(true);
  };

  // Perform export all action
  const performExportAll = () => {
    // In a real app, this would generate and download all filtered orders
    toast({
      title: "Órdenes Exportadas",
      description: `${filteredOrders.length} órdenes han sido exportadas`,
    });
    setIsExportAllDialogOpen(false);
  };

  // Handle mark as paid
  const handleMarkAsPaid = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsMarkPaidDialogOpen(true);
  };

  // Handle marking order as paid
  const performMarkAsPaid = async () => {
    try {
      setIsRefreshing(true);

      // First find the order to get its current total
      const orderResponse = await fetch(`/api/orders/${selectedOrderId}`);
      if (!orderResponse.ok) {
        throw new Error("Failed to fetch order details");
      }

      // Update order with PAID status
      const response = await fetch(`/api/orders/${selectedOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentStatus: "PAID",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      // Update the order in UI optimistically
      if (selectedOrderId) {
        updateOrder.mutate({
          id: selectedOrderId,
          paymentStatus: "PAID",
        });
      }

      toast({
        title: "Éxito",
        description: "Orden marcada como pagada",
      });
    } catch (error) {
      console.error("Failed to mark order as paid:", error);
      toast({
        title: "Error",
        description: "Failed to mark order as paid",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
      setIsMarkPaidDialogOpen(false);
      setSelectedOrderId(null);
    }
  };

  // Define table columns
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "ID de Orden",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.id.substring(0, 8)}...</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) => (
        <div>{format(new Date(row.original.createdAt), "MMM dd, yyyy p")}</div>
      ),
    },
    {
      accessorKey: "company.name",
      header: "Empresa",
      cell: ({ row }) => <div>{row.original.company?.name || "-"}</div>,
    },
    {
      accessorKey: "tableSession.table.name",
      header: "Mesa",
      cell: ({ row }) => (
        <div>
          {row.original.tableSession ? (
            <div className="space-y-1">
              <div>{row.original.tableSession.table.name}</div>
              {row.original.tableSession.totalCost && (
                <div className="text-xs text-muted-foreground">
                  Sesión: Bs.
                  {Number(row.original.tableSession.totalCost).toFixed(2)}
                </div>
              )}
            </div>
          ) : (
            "-"
          )}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Monto",
      cell: ({ row }) => (
        <div>Bs. {Number(row.original.amount).toFixed(2)}</div>
      ),
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
      header: "Acciones",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(order.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint(order.id)}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Factura
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintPdf(order.id)}>
                <FileText className="mr-2 h-4 w-4" />
                Imprimir PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(order.id)}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Orden
              </DropdownMenuItem>
              {order.paymentStatus !== "PAID" && (
                <DropdownMenuItem onClick={() => handleMarkAsPaid(order.id)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Marcar como Pagado
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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

  // Action buttons for header
  const actionButtons = (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
        />
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportAll}>
        <Download className="h-4 w-4 mr-2" />
        Export All
      </Button>
      <Button size="sm" onClick={handleCreateNewOrder}>
        <FilePlus className="h-4 w-4 mr-2" />
        New Order
      </Button>
    </div>
  );

  // Render function for main content based on loading/error state
  const renderContent = () => {
    if (isLoading && orders.length === 0) {
      return <OrderHistorySkeleton />;
    }

    return (
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold tracking-tight">
                Orders History
              </h3>
              {(ordersIsFetching || isRefreshing) && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
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
          {actionButtons}
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

      {/* Print Invoice Dialog */}
      <AlertDialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Print Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Print invoice for order #{selectedOrderId?.substring(0, 8)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performPrint}>Print</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print PDF Dialog */}
      <AlertDialog
        open={isPrintPdfDialogOpen}
        onOpenChange={setIsPrintPdfDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Print PDF</AlertDialogTitle>
            <AlertDialogDescription>
              Generate and print PDF for order #
              {selectedOrderId?.substring(0, 8)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performPrintPdf}>
              Print PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <AlertDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Order</AlertDialogTitle>
            <AlertDialogDescription>
              Export order #{selectedOrderId?.substring(0, 8)} to PDF format
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performExport}>
              Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export All Dialog */}
      <AlertDialog
        open={isExportAllDialogOpen}
        onOpenChange={setIsExportAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export All Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Export all {filteredOrders.length} filtered orders to a
              spreadsheet
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performExportAll}>
              Export All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Paid Dialog */}
      <AlertDialog
        open={isMarkPaidDialogOpen}
        onOpenChange={setIsMarkPaidDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Order as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark order #
              {selectedOrderId?.substring(0, 8)} as paid?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performMarkAsPaid}
              disabled={updateOrder.isPending || isRefreshing}
            >
              {updateOrder.isPending || isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Mark as Paid"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
import { useCurrentUser } from "@/hooks/use-current-user";
import { generateOrderPDF, generateMultipleOrdersPDF } from "@/lib/pdf-utils";

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
  discount?: number;
  paymentMethod: "CASH" | "QR" | "CREDIT_CARD";
  paymentStatus: "PAID" | "UNPAID";
  staffId?: string;
  staff?: {
    id: string;
    firstName?: string;
    lastName?: string;
    userId: string;
  };
  orderItems?: {
    quantity: number;
    unitPrice: number;
  }[];
}

export function OrderHistory() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { companies, selectedCompany } = useCompany();
  const { profile, isLoading: isProfileLoading } = useCurrentUser();
  const isSuperAdmin = profile?.role === "SUPERADMIN";

  // For non-superadmins, always filter by their company
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

  // Automatically set company filter based on user's profile
  useEffect(() => {
    if (!isProfileLoading && profile) {
      if (profile.role !== "SUPERADMIN") {
        if (profile.companyId) {
          setFilterByCompany(true);
          setSelectedCompanyId(profile.companyId);
          console.log(
            "Auto-filtering orders by user's company:",
            profile.companyId
          );
        }
      } else if (selectedCompany?.id) {
        setSelectedCompanyId(selectedCompany.id);
      }
    }
  }, [profile, isProfileLoading, selectedCompany?.id]);

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

  // Check if there's an order to view from URL parameters
  useEffect(() => {
    const viewOrderId = searchParams.get("viewOrder");
    if (viewOrderId) {
      // Wait until orders are loaded before opening the dialog
      if (!isLoading && orders.length > 0) {
        // Make sure this order exists in our loaded orders
        const orderExists = orders.some((order) => order.id === viewOrderId);

        if (orderExists) {
          // Open the order details dialog for this order
          setSelectedOrderId(viewOrderId);
          setIsDetailsOpen(true);

          // Remove the query parameter to avoid reopening on refresh
          // This creates a new URL without the viewOrder parameter
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("viewOrder");

          // Update browser history without reloading the page
          window.history.replaceState({}, "", newUrl.toString());
        } else {
          // If the order isn't in our loaded orders, force a refetch
          // This can happen when a new order was just created
          queryClient.invalidateQueries({ queryKey: ["posOrders"] });
        }
      }
      // If still loading, we'll wait for the next render cycle when orders are loaded
    }
  }, [searchParams, isLoading, orders, queryClient]);

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
    // Only allow superadmins to change company filter
    if (isSuperAdmin) {
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
    if (!selectedOrderId) return;

    try {
      // Find the order details in the loaded orders
      const order = orders.find((order) => order.id === selectedOrderId);

      if (!order) {
        throw new Error("Order not found");
      }

      // Generate PDF document
      const doc = generateOrderPDF(order);

      // Save the PDF file with the order ID in the filename
      doc.save(`orden-${order.id.substring(0, 8)}.pdf`);

      toast({
        title: "Orden Exportada",
        description: `Orden #${selectedOrderId?.substring(0, 8)} ha sido exportada a PDF`,
      });
    } catch (error) {
      console.error("Error exporting order:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar la orden a PDF",
        variant: "destructive",
      });
    }

    setIsExportDialogOpen(false);
  };

  // Handle export all orders
  const handleExportAll = () => {
    setIsExportAllDialogOpen(true);
  };

  // Perform export all action
  const performExportAll = () => {
    try {
      // Check if there are orders to export
      if (!filteredOrders || filteredOrders.length === 0) {
        throw new Error("No hay órdenes para exportar");
      }

      // Generate a single PDF with all orders
      const doc = generateMultipleOrdersPDF(filteredOrders);

      // Save the combined PDF
      doc.save(`ordenes-billar-${format(new Date(), "yyyy-MM-dd")}.pdf`);

      toast({
        title: "Órdenes Exportadas",
        description: `${filteredOrders.length} órdenes han sido exportadas en un único PDF`,
      });
    } catch (error) {
      console.error("Error exporting all orders:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron exportar las órdenes",
        variant: "destructive",
      });
    }

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

      if (!selectedOrderId) {
        throw new Error("No order selected");
      }

      // Use the existing updateOrder mutation instead of manual fetch
      await updateOrder.mutateAsync({
        id: selectedOrderId,
        paymentStatus: "PAID",
      });

      toast({
        title: "Éxito",
        description: "Orden marcada como pagada",
      });
    } catch (error) {
      console.error("Failed to mark order as paid:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to mark order as paid",
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
      cell: ({ row }) => {
        const orderId = row.getValue("id") as string;
        return (
          <div className="font-mono text-sm">{orderId.substring(0, 8)}</div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string;
        return (
          <div className="text-sm">
            {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
          </div>
        );
      },
    },
    {
      id: "company",
      header: "Empresa",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="text-sm">{order.company?.name || "Sin empresa"}</div>
        );
      },
    },
    {
      id: "table",
      header: "Mesa",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="text-sm">
            {order.tableSession?.table.name || "Sin mesa"}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Total",
      cell: ({ row }) => {
        const order = row.original;
        // Calculate correct total: products + table cost - discount
        const productTotal =
          order.orderItems?.reduce(
            (sum, item) => sum + item.quantity * Number(item.unitPrice),
            0
          ) || 0;
        const tableCost = Number(order.tableSession?.totalCost) || 0;
        const discount = Number(order.discount) || 0;
        const correctTotal = productTotal + tableCost - discount;

        return <div className="font-medium">Bs. {correctTotal.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "discount",
      header: "Descuento",
      cell: ({ row }) => {
        const discount = row.getValue("discount") as number | null;
        return (
          <div className="text-red-600">
            {discount && Number(discount) > 0
              ? `-Bs. ${Number(discount).toFixed(2)}`
              : "--"}
          </div>
        );
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Método de Pago",
      cell: ({ row }) => {
        const method = row.getValue("paymentMethod") as
          | "CASH"
          | "QR"
          | "CREDIT_CARD";
        return <Badge variant="outline">{getPaymentMethodText(method)}</Badge>;
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("paymentStatus") as "PAID" | "UNPAID";
        return (
          <Badge
            variant={status === "PAID" ? "default" : "destructive"}
            className={status === "PAID" ? "bg-green-500" : ""}
          >
            {getPaymentStatusText(status)}
          </Badge>
        );
      },
    },
    {
      id: "staff",
      header: "Personal",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="text-sm">
            {order.staff
              ? `${order.staff.firstName || ""} ${order.staff.lastName || ""}`.trim() ||
                "Desconocido"
              : "Sin asignar"}
          </div>
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
                <span className="sr-only">Abrir menú</span>
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
                Exportar PDF
              </DropdownMenuItem>
              {order.paymentStatus === "UNPAID" && (
                <DropdownMenuItem onClick={() => handleMarkAsPaid(order.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
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
        <SelectValue placeholder="Todos los Estados" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Todos los Estados</SelectItem>
        <SelectItem value="PAID">Pagado</SelectItem>
        <SelectItem value="UNPAID">Pendiente</SelectItem>
      </SelectContent>
    </Select>
  );

  // Filter row elements
  const filterRow = (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
      {/* Company Filter - Only shown to superadmins */}
      {isSuperAdmin && (
        <Select
          onValueChange={handleCompanyChange}
          defaultValue={filterByCompany ? selectedCompanyId : "ALL"}
          value={filterByCompany ? selectedCompanyId : "ALL"}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Select Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las Empresas</SelectItem>
            {companies.map((company: { id: string; name: string }) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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
        Limpiar Filtros
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
        {isRefreshing ? "Actualizando..." : "Actualizar"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportAll}>
        <Download className="h-4 w-4 mr-2" />
        Exportar Todo
      </Button>
      <Button size="sm" onClick={handleCreateNewOrder}>
        <FilePlus className="h-4 w-4 mr-2" />
        Nueva Orden
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
                Historial de Órdenes
              </h3>
              {(ordersIsFetching || isRefreshing) && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredOrders.length} órdenes encontradas
              {pagination && (
                <span className="ml-2">
                  (Página {pagination.page} de {pagination.totalPages}, Total:{" "}
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
          searchPlaceholder="Buscar órdenes..."
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
            <AlertDialogTitle>Imprimir Factura</AlertDialogTitle>
            <AlertDialogDescription>
              Imprimir factura para la orden #{selectedOrderId?.substring(0, 8)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performPrint}>
              Imprimir
            </AlertDialogAction>
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
            <AlertDialogTitle>Imprimir PDF</AlertDialogTitle>
            <AlertDialogDescription>
              Generar e imprimir PDF para la orden #
              {selectedOrderId?.substring(0, 8)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performPrintPdf}>
              Imprimir PDF
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
            <AlertDialogTitle>Exportar Órdenes</AlertDialogTitle>
            <AlertDialogDescription>
              Exportar todas las órdenes visibles a PDF. Esto puede tomar un
              momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performExport}>
              Exportar a PDF
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
            <AlertDialogTitle>Exportar Todas las Órdenes</AlertDialogTitle>
            <AlertDialogDescription>
              Exportar todas las {filteredOrders.length} órdenes filtradas a una
              hoja de cálculo
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performExportAll}>
              Exportar Todo
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
            <AlertDialogTitle>Marcar Orden como Pagada</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres marcar la orden #
              {selectedOrderId?.substring(0, 8)} como pagada?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={performMarkAsPaid}
              disabled={updateOrder.isPending || isRefreshing}
            >
              {updateOrder.isPending || isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Marcar como Pagada"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

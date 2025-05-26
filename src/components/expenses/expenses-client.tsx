"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Zap,
  Wrench,
  ShieldAlert,
  MoreHorizontal,
  RefreshCw,
  CalendarIcon,
  X,
} from "lucide-react";
import { DateRange } from "@/components/ui/date-range-picker";
import { formatCurrency } from "@/lib/utils";
import { useExpenses, useDeleteExpense, Expense } from "@/hooks/use-expenses";
import { useCurrentUser } from "@/hooks/use-current-user";
import { DataTable } from "@/components/tables/data-table";
import { ExpenseDialog } from "./expense-dialog";
import { ExpensesSkeleton } from "./expenses-skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
  { value: "STAFF", label: "Personal", icon: Users, color: "bg-blue-500" },
  { value: "UTILITIES", label: "Servicios", icon: Zap, color: "bg-yellow-500" },
  {
    value: "MAINTENANCE",
    label: "Mantenimiento",
    icon: Wrench,
    color: "bg-orange-500",
  },
  {
    value: "SUPPLIES",
    label: "Suministros",
    icon: DollarSign,
    color: "bg-green-500",
  },
  {
    value: "RENT",
    label: "Alquiler",
    icon: DollarSign,
    color: "bg-purple-500",
  },
  {
    value: "INSURANCE",
    label: "Seguros",
    icon: DollarSign,
    color: "bg-indigo-500",
  },
  {
    value: "MARKETING",
    label: "Marketing",
    icon: DollarSign,
    color: "bg-pink-500",
  },
  { value: "OTHER", label: "Otros", icon: DollarSign, color: "bg-gray-500" },
];

export function ExpensesClient() {
  const { profile, isLoading: isLoadingProfile } = useCurrentUser();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const deleteExpense = useDeleteExpense();

  // Check if user has access to this module
  const hasAccess = profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";
  const isSuperAdmin = profile?.role === "SUPERADMIN";
  const isAdmin = profile?.role === "ADMIN";

  // Fetch companies the user has access to
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error("Error al cargar las empresas");
      }
      return response.json();
    },
    enabled: hasAccess && isSuperAdmin, // Only fetch companies for SUPERADMIN
  });

  // Set companies and default selected company when data loads
  useEffect(() => {
    if (isLoadingProfile) return;

    if (isAdmin && profile?.companyId) {
      // For ADMIN users, preset their company
      setSelectedCompany(profile.companyId);
    } else if (isSuperAdmin && companiesData?.length > 0) {
      // For SUPERADMIN users, set companies and default to first one
      setCompanies(companiesData);
      setSelectedCompany(companiesData[0].id);
    }
  }, [profile, companiesData, isLoadingProfile, isAdmin, isSuperAdmin]);

  // Fetch expenses
  const {
    data: expenses,
    isLoading: isLoadingExpenses,
    refetch: refetchExpenses,
  } = useExpenses({
    companyId: selectedCompany,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
    enabled: !!selectedCompany && hasAccess,
  });

  // Show loading state while checking user profile
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Verificando acceso...
        </span>
      </div>
    );
  }

  // Show access denied message for unauthorized users
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ShieldAlert className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Acceso Denegado</h2>
          <p className="text-muted-foreground max-w-md">
            No tienes permisos para acceder al módulo de gastos. Solo los
            administradores y super administradores pueden gestionar los gastos.
          </p>
        </div>
      </div>
    );
  }

  // Calculate summary data by category
  const summaryData = expenses?.reduce(
    (acc, expense) => {
      const amount = Number(expense.amount);
      acc.total += amount;

      switch (expense.category) {
        case "STAFF":
          acc.staff += amount;
          break;
        case "UTILITIES":
          acc.utilities += amount;
          break;
        case "MAINTENANCE":
          acc.maintenance += amount;
          break;
        default:
          acc.other += amount;
          break;
      }

      return acc;
    },
    { total: 0, staff: 0, utilities: 0, maintenance: 0, other: 0 }
  ) || { total: 0, staff: 0, utilities: 0, maintenance: 0, other: 0 };

  // Filter expenses by search term
  const filteredExpenses =
    expenses?.filter((expense) => {
      if (!searchTerm) return true;
      const termLower = searchTerm.toLowerCase();
      return (
        expense.description.toLowerCase().includes(termLower) ||
        expense.category.toLowerCase().includes(termLower) ||
        getCategoryLabel(expense.category).toLowerCase().includes(termLower)
      );
    }) || [];

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este gasto?")) {
      try {
        await deleteExpense.mutateAsync(id);
        toast({
          title: "Gasto eliminado",
          description: "El gasto ha sido eliminado exitosamente.",
        });
      } catch {
        toast({
          title: "Error",
          description: "No se pudo eliminar el gasto.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    refetchExpenses();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchExpenses().finally(() => {
      setIsRefreshing(false);
      toast({
        title: "Datos actualizados",
        description: "Los gastos han sido actualizados exitosamente.",
      });
    });
  };

  const handleCompanyChange = (companyId: string) => {
    if (isSuperAdmin) {
      setSelectedCompany(companyId);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setDateRange({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    });
    setSearchTerm("");
  };

  const getCategoryLabel = (category: string) => {
    return (
      EXPENSE_CATEGORIES.find((cat) => cat.value === category)?.label ||
      category
    );
  };

  const getCategoryColor = (category: string) => {
    return (
      EXPENSE_CATEGORIES.find((cat) => cat.value === category)?.color ||
      "bg-gray-500"
    );
  };

  // Define table columns
  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "expenseDate",
      header: "Fecha",
      cell: ({ row }) => {
        const date = row.getValue("expenseDate") as string;
        return (
          <div className="text-sm">{format(new Date(date), "dd/MM/yyyy")}</div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`}
            />
            <span className="text-sm">{getCategoryLabel(category)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <div
            className="font-medium max-w-[200px] truncate"
            title={description}
          >
            {description}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Monto",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return (
          <div className="text-right font-medium">{formatCurrency(amount)}</div>
        );
      },
    },
    {
      id: "createdBy",
      header: "Creado por",
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="text-sm">
            {expense.createdBy
              ? `${expense.createdBy.firstName || ""} ${expense.createdBy.lastName || ""}`.trim()
              : "N/A"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const expense = row.original;
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
              <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteExpense(expense.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Status filter component
  const categoryFilterElement = (
    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
      <SelectTrigger className="w-full md:w-[180px]">
        <SelectValue placeholder="Todas las categorías" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las categorías</SelectItem>
        {EXPENSE_CATEGORIES.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${category.color}`} />
              {category.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Filter row elements
  const filterRow = (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
      {/* Company Filter - Only shown to superadmins */}
      {isSuperAdmin && (
        <Select
          value={selectedCompany}
          onValueChange={handleCompanyChange}
          disabled={isLoadingCompanies}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Seleccionar empresa" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Company display for ADMIN users */}
      {isAdmin && (
        <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md text-sm w-full md:w-[180px]">
          Mi Empresa
        </div>
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
                  {format(dateRange.from, "dd/MM/yy")} -{" "}
                  {format(dateRange.to, "dd/MM/yy")}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Rango de fechas</span>
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

      {categoryFilterElement}

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
      <Button size="sm" onClick={handleAddExpense} disabled={!selectedCompany}>
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Gasto
      </Button>
    </div>
  );

  // Render main content
  const renderContent = () => {
    if (isLoadingExpenses && !expenses) {
      return <ExpensesSkeleton />;
    }

    return (
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold tracking-tight">
                Gestión de Gastos
              </h3>
              {isRefreshing && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.length} gastos encontrados
            </p>
          </div>
          {actionButtons}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Gastos
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryData.total)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total del período seleccionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personal</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryData.staff)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gastos de personal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryData.utilities)}
              </div>
              <p className="text-xs text-muted-foreground">
                Servicios públicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mantenimiento
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryData.maintenance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gastos de mantenimiento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {filterRow}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredExpenses}
          onSearch={setSearchTerm}
          searchPlaceholder="Buscar gastos..."
        />
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      {/* Expense Dialog */}
      <ExpenseDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        expense={editingExpense}
        companyId={selectedCompany}
      />
    </>
  );
}

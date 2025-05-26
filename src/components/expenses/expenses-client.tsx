"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Zap,
  Wrench,
} from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { formatCurrency } from "@/lib/utils";
import { useExpenses, useDeleteExpense, Expense } from "@/hooks/use-expenses";
import { ExpenseDialog } from "./expense-dialog";

const EXPENSE_CATEGORIES = [
  { value: "STAFF", label: "Personal", icon: Users },
  { value: "UTILITIES", label: "Servicios", icon: Zap },
  { value: "MAINTENANCE", label: "Mantenimiento", icon: Wrench },
  { value: "SUPPLIES", label: "Suministros", icon: DollarSign },
  { value: "RENT", label: "Alquiler", icon: DollarSign },
  { value: "INSURANCE", label: "Seguros", icon: DollarSign },
  { value: "MARKETING", label: "Marketing", icon: DollarSign },
  { value: "OTHER", label: "Otros", icon: DollarSign },
];

export function ExpensesClient() {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const deleteExpense = useDeleteExpense();

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
  });

  // Set companies and default selected company when data loads
  useEffect(() => {
    if (companiesData?.length > 0) {
      setCompanies(companiesData);
      setSelectedCompany(companiesData[0].id);
    }
  }, [companiesData]);

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
    enabled: !!selectedCompany,
  });

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
      await deleteExpense.mutateAsync(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    refetchExpenses();
  };

  const getCategoryLabel = (category: string) => {
    return (
      EXPENSE_CATEGORIES.find((cat) => cat.value === category)?.label ||
      category
    );
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = EXPENSE_CATEGORIES.find(
      (cat) => cat.value === category
    );
    const IconComponent = categoryData?.icon || DollarSign;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Select
              disabled={isLoadingCompanies}
              value={selectedCompany}
              onValueChange={setSelectedCompany}
            >
              <SelectTrigger id="company" className="w-48">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category" className="w-48">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rango de Fechas</Label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Seleccionar rango"
              className="w-64"
            />
          </div>
        </div>

        <div className="flex items-end">
          <Button onClick={handleAddExpense}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Gasto
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingExpenses ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              ) : (
                formatCurrency(summaryData.total)
              )}
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
              {isLoadingExpenses ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              ) : (
                formatCurrency(summaryData.staff)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Gastos de personal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingExpenses ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              ) : (
                formatCurrency(summaryData.utilities)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Servicios públicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingExpenses ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              ) : (
                formatCurrency(summaryData.maintenance)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Gastos de mantenimiento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gastos</CardTitle>
          <CardDescription>
            Gestiona todos los gastos operativos de tu empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExpenses ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Cargando gastos...
              </span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Creado por</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses && expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {format(new Date(expense.expenseDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(expense.category)}
                          {getCategoryLabel(expense.category)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        {expense.createdBy
                          ? `${expense.createdBy.firstName || ""} ${expense.createdBy.lastName || ""}`.trim()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={deleteExpense.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay gastos registrados para los filtros seleccionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Expense Dialog */}
      <ExpenseDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        expense={editingExpense}
        companyId={selectedCompany}
      />
    </div>
  );
}

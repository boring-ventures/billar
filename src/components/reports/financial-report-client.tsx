"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Save,
  ExternalLink,
  FileDown,
  Info,
} from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { generateReportPDF } from "@/lib/pdf-utils";

// Define types
interface FinancialReport {
  id: string;
  name: string;
  reportType: string;
  startDate: string;
  endDate: string;
  salesIncome: number;
  tableRentIncome: number;
  otherIncome: number;
  totalIncome: number;
  inventoryCost: number;
  maintenanceCost: number;
  staffCost: number;
  utilityCost: number;
  otherExpenses: number;
  totalExpense: number;
  netProfit: number;
  generatedAt: string;
}

export function FinancialReportClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [reportType, setReportType] = useState<string>("DAILY");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);
  const [liveReportData, setLiveReportData] = useState<
    FinancialReport[] | null
  >(null);

  // Check if company has business hours configured
  const { data: companyBusinessHours } = useQuery({
    queryKey: ["companyBusinessHours", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return null;
      const response = await fetch(`/api/companies/${selectedCompany}`);
      if (!response.ok) {
        throw new Error("Failed to fetch company data");
      }
      return response.json();
    },
    enabled: !!selectedCompany,
  });

  const hasBusinessHours =
    companyBusinessHours &&
    ((companyBusinessHours.useIndividualHours &&
      companyBusinessHours.individualDayHours) ||
      (companyBusinessHours.businessHoursStart &&
        companyBusinessHours.businessHoursEnd));

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

  // Helper function to combine date and time for API calls
  const combineDateTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  };

  // Helper function to get the effective date range for API calls
  const getEffectiveDateRange = useCallback(() => {
    if (reportType === "DAILY" && singleDate) {
      return {
        from: singleDate,
        to: singleDate,
      };
    }

    if (reportType === "CUSTOM" && dateRange?.from && dateRange?.to) {
      return {
        from: combineDateTime(dateRange.from, "00:00"),
        to: combineDateTime(dateRange.to, "23:59"),
      };
    }

    return dateRange;
  }, [reportType, singleDate, dateRange]);

  // Fetch saved financial reports based on filters
  const {
    data: savedReports,
    isLoading: isLoadingSavedReports,
    refetch: refetchSavedReports,
  } = useQuery({
    queryKey: [
      "savedFinancialReports",
      selectedCompany,
      reportType,
      reportType === "DAILY"
        ? singleDate?.toISOString()
        : JSON.stringify(dateRange),
    ],
    queryFn: async () => {
      const effectiveDateRange = getEffectiveDateRange();

      if (
        !selectedCompany ||
        !effectiveDateRange?.from ||
        !effectiveDateRange?.to
      ) {
        return [];
      }

      const params = new URLSearchParams({
        companyId: selectedCompany,
        reportType,
        startDate: effectiveDateRange.from.toISOString(),
        endDate: effectiveDateRange.to.toISOString(),
      });

      const response = await fetch(`/api/financial-reports?${params}`);
      if (!response.ok) {
        throw new Error("Error al cargar los reportes financieros");
      }
      return response.json();
    },
    enabled:
      !!selectedCompany &&
      ((reportType === "DAILY" && !!singleDate) ||
        (reportType === "CUSTOM" && !!dateRange?.from && !!dateRange?.to)),
  });

  // Fetch live data whenever filters change
  useEffect(() => {
    const fetchLiveData = async () => {
      const effectiveDateRange = getEffectiveDateRange();

      if (
        !selectedCompany ||
        !effectiveDateRange?.from ||
        !effectiveDateRange?.to
      ) {
        setLiveReportData(null);
        return;
      }

      try {
        setIsLoadingLiveData(true);

        const params = new URLSearchParams({
          companyId: selectedCompany,
          reportType,
          startDate: effectiveDateRange.from.toISOString(),
          endDate: effectiveDateRange.to.toISOString(),
          live: "true", // Add a parameter to indicate this is a live data request
        });

        const response = await fetch(`/api/financial-reports/data?${params}`);

        if (!response.ok) {
          throw new Error("Error al cargar datos en tiempo real");
        }

        const data = await response.json();
        setLiveReportData(data);
      } catch (error) {
        console.error("Error al cargar datos en tiempo real:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar datos en tiempo real",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLiveData(false);
      }
    };

    if (
      selectedCompany &&
      ((reportType === "DAILY" && singleDate) ||
        (reportType === "CUSTOM" && dateRange?.from && dateRange?.to))
    ) {
      fetchLiveData();
    } else {
      // Clear live data if conditions are not met
      setLiveReportData(null);
    }
  }, [
    selectedCompany,
    reportType,
    singleDate,
    dateRange,
    toast,
    getEffectiveDateRange,
  ]);

  // Get report data - prioritize live data if available, fall back to saved reports
  const reports = liveReportData || savedReports || [];
  const isLoadingReports = isLoadingLiveData || isLoadingSavedReports;

  // Calculate summary data
  const summaryData =
    reports?.length > 0
      ? reports.reduce(
          (
            acc: {
              totalIncome: number;
              totalExpense: number;
              netProfit: number;
            },
            report: FinancialReport
          ) => {
            acc.totalIncome += Number(report.totalIncome);
            acc.totalExpense += Number(report.totalExpense);
            acc.netProfit += Number(report.netProfit);
            return acc;
          },
          { totalIncome: 0, totalExpense: 0, netProfit: 0 }
        )
      : { totalIncome: 0, totalExpense: 0, netProfit: 0 };

  // Generate and save a report
  const handleGenerateReport = async () => {
    const effectiveDateRange = getEffectiveDateRange();

    if (
      !selectedCompany ||
      !effectiveDateRange?.from ||
      !effectiveDateRange?.to
    ) {
      toast({
        title: "Error",
        description:
          reportType === "DAILY"
            ? "Por favor selecciona una empresa y fecha"
            : "Por favor selecciona una empresa y rango de fechas",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);

      const response = await fetch("/api/financial-reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: selectedCompany,
          reportType,
          startDate: effectiveDateRange.from.toISOString(),
          endDate: effectiveDateRange.to.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al generar el reporte");
      }

      toast({
        title: "Éxito",
        description: "Reporte financiero guardado exitosamente",
      });

      // Refetch reports after generation
      refetchSavedReports();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasReports = reports && reports.length > 0;

  // Navigate to report detail page
  const handleViewReportDetail = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  // Export a report to PDF
  const handleExportToPDF = (report: FinancialReport) => {
    try {
      // Generate the PDF
      const doc = generateReportPDF(report);

      // Save the PDF with a filename based on the report
      doc.save(
        `reporte-${report.name.replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`
      );

      toast({
        title: "Éxito",
        description: "Reporte exportado a PDF exitosamente",
      });
    } catch (error) {
      console.error("Error al exportar reporte a PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte a PDF",
        variant: "destructive",
      });
    }
  };

  // Handle report type change and automatically adjust date range for daily reports
  const handleReportTypeChange = (newReportType: string) => {
    setReportType(newReportType);

    const now = new Date();

    if (newReportType === "DAILY") {
      // When switching to daily, use the current single date or set today if none
      if (!singleDate) {
        setSingleDate(now);
      }
    } else if (newReportType === "CUSTOM") {
      // For custom reports, use last 7 days as default
      const from = new Date(now);
      from.setDate(now.getDate() - 6); // 7 days including today
      from.setHours(0, 0, 0, 0);

      const to = new Date(now);
      to.setHours(23, 59, 59, 999);

      setDateRange({ from, to });
    }
  };

  // Helper function to handle single date changes with debugging
  const handleSingleDateChange = (newDate: Date | undefined) => {
    setSingleDate(newDate);
  };

  // Helper function to convert date to input format
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    // Create a new date in local timezone to avoid timezone issues
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().split("T")[0];
  };

  // Helper function to handle date input changes
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      // Create date at noon in local timezone to avoid timezone issues
      const [year, month, day] = value.split("-").map(Number);
      const newDate = new Date(year, month - 1, day, 12, 0, 0);
      handleSingleDateChange(newDate);
    } else {
      handleSingleDateChange(undefined);
    }
  };

  // Helper function to handle date range changes with debugging
  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange(newRange);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Select
              disabled={isLoadingCompanies}
              value={selectedCompany}
              onValueChange={setSelectedCompany}
            >
              <SelectTrigger id="company">
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
            <Label htmlFor="reportType">Tipo de Reporte</Label>
            <Select value={reportType} onValueChange={handleReportTypeChange}>
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">
                  <div className="flex items-center gap-2">
                    <span>Diario</span>
                    {hasBusinessHours && (
                      <span className="text-xs text-blue-600">
                        (Día de negocio)
                      </span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="CUSTOM">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label>
              {reportType === "DAILY" ? "Fecha del Reporte" : "Rango de Fechas"}
            </Label>
            {reportType === "DAILY" ? (
              <div className="space-y-2">
                <Input
                  type="date"
                  value={formatDateForInput(singleDate)}
                  onChange={handleDateInputChange}
                  placeholder="Seleccionar fecha"
                  className="w-full"
                />
                {hasBusinessHours && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Info className="h-3 w-3" />
                    <span>
                      Reporte calculado según horarios de negocio configurados
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder="Seleccionar rango"
                className="w-full"
              />
            )}
          </div>
        </div>

        <Button onClick={handleGenerateReport} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando
              reporte...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Guardar Reporte
            </>
          )}
        </Button>
      </div>

      {isLoadingReports && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Cargando datos del reporte...
          </span>
        </div>
      )}

      {/* Show report cards only if there are reports available or loading */}
      {(hasReports || isLoadingReports) && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ingresos Totales
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingReports ? (
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  ) : (
                    formatCurrency(summaryData.totalIncome)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos los ingresos del periodo seleccionado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Gastos Totales
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingReports ? (
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  ) : (
                    formatCurrency(summaryData.totalExpense)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos los gastos del periodo seleccionado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ganancia Neta
                </CardTitle>
                {!isLoadingReports &&
                  (summaryData.netProfit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ))}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${!isLoadingReports && (summaryData.netProfit >= 0 ? "text-green-500" : "text-red-500")}`}
                >
                  {isLoadingReports ? (
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  ) : (
                    formatCurrency(summaryData.netProfit)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingresos - Gastos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income & Expense Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Desglose de Ingresos</CardTitle>
                <CardDescription>
                  Detalle de fuentes de ingresos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ventas (POS)</span>
                      <span className="text-sm">
                        {formatCurrency(
                          reports.reduce(
                            (acc: number, report: FinancialReport) =>
                              acc + Number(report.salesIncome),
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Renta de Mesas
                      </span>
                      <span className="text-sm">
                        {formatCurrency(
                          reports.reduce(
                            (acc: number, report: FinancialReport) =>
                              acc + Number(report.tableRentIncome),
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Otros Ingresos
                      </span>
                      <span className="text-sm">
                        {formatCurrency(
                          reports.reduce(
                            (acc: number, report: FinancialReport) =>
                              acc + Number(report.otherIncome),
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div className="pt-2 border-t flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(summaryData.totalIncome)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desglose de Gastos</CardTitle>
                <CardDescription>
                  Detalle completo de gastos operativos por categoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Inventory Costs */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Inventario para Venta
                        </span>
                        <span className="text-sm">
                          {formatCurrency(
                            reports.reduce(
                              (acc: number, report: FinancialReport) =>
                                acc + Number(report.inventoryCost),
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-4">
                        Productos comprados para reventa
                      </div>
                    </div>

                    {/* Staff Costs */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Personal</span>
                        <span className="text-sm">
                          {formatCurrency(
                            reports.reduce(
                              (acc: number, report: FinancialReport) =>
                                acc + Number(report.staffCost),
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-4">
                        Salarios, bonos, beneficios del personal
                      </div>
                    </div>

                    {/* Utilities */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Servicios Públicos
                        </span>
                        <span className="text-sm">
                          {formatCurrency(
                            reports.reduce(
                              (acc: number, report: FinancialReport) =>
                                acc + Number(report.utilityCost),
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-4">
                        Electricidad, agua, gas, internet, teléfono
                      </div>
                    </div>

                    {/* Maintenance */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Mantenimiento
                        </span>
                        <span className="text-sm">
                          {formatCurrency(
                            reports.reduce(
                              (acc: number, report: FinancialReport) =>
                                acc + Number(report.maintenanceCost),
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-4">
                        Reparación de mesas, equipos, instalaciones
                      </div>
                    </div>

                    {/* Other Expenses */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Otros Gastos Operativos
                        </span>
                        <span className="text-sm">
                          {formatCurrency(
                            reports.reduce(
                              (acc: number, report: FinancialReport) =>
                                acc + Number(report.otherExpenses),
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-4">
                        Suministros, alquiler, seguros, marketing, limpieza,
                        papelería
                      </div>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center font-bold">
                      <span>Total Gastos</span>
                      <span>{formatCurrency(summaryData.totalExpense)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reports Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Reportes Guardados</CardTitle>
              <CardDescription>
                Reportes financieros generados previamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedReports?.length > 0 ? (
                    savedReports.map((report: FinancialReport) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.name}
                        </TableCell>
                        <TableCell>
                          {report.reportType === "DAILY"
                            ? "Diario"
                            : report.reportType === "WEEKLY"
                              ? "Semanal"
                              : report.reportType === "MONTHLY"
                                ? "Mensual"
                                : report.reportType === "QUARTERLY"
                                  ? "Trimestral"
                                  : report.reportType === "ANNUAL"
                                    ? "Anual"
                                    : "Personalizado"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.startDate), "dd/MM/yyyy")} -{" "}
                          {format(new Date(report.endDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(report.totalIncome)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(report.totalExpense)}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            Number(report.netProfit) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(report.netProfit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewReportDetail(report.id)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Ver Reporte</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExportToPDF(report)}
                            >
                              <FileDown className="h-4 w-4" />
                              <span className="sr-only">Exportar a PDF</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No hay reportes guardados para los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!hasReports && !isLoadingReports && (
        <div className="text-center p-6 bg-muted rounded-md">
          <p className="text-muted-foreground">
            No hay datos disponibles para el período seleccionado. Modifica los
            filtros para ver diferentes periodos o presiona &quot;Guardar
            Reporte&quot; para guardar permanentemente este reporte.
          </p>
        </div>
      )}
    </div>
  );
}

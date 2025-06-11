"use client";

import { useState, useEffect } from "react";
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
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Save,
  ExternalLink,
  FileDown,
} from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { DatePicker } from "@/components/ui/date-picker";
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
  const [reportType, setReportType] = useState<string>("MONTHLY");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);
  const [liveReportData, setLiveReportData] = useState<
    FinancialReport[] | null
  >(null);

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

  // Helper function to get the effective date range for API calls
  const getEffectiveDateRange = () => {
    if (reportType === "DAILY" && singleDate) {
      return {
        from: singleDate,
        to: singleDate,
      };
    }
    return dateRange;
  };

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
      reportType === "DAILY" ? singleDate : dateRange,
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
        (reportType !== "DAILY" && !!dateRange?.from && !!dateRange?.to)),
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
          throw new Error("Error al cargar datos en tiempo real del reporte");
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
        (reportType !== "DAILY" && dateRange?.from && dateRange?.to))
    ) {
      fetchLiveData();
    }
  }, [selectedCompany, reportType, singleDate, dateRange, toast]);

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
    } else {
      // Automatically set appropriate date ranges based on report type
      let from: Date;
      let to: Date;

      switch (newReportType) {
        case "WEEKLY":
          // Current week (Monday to Sunday)
          from = new Date(now);
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days to Monday
          from.setDate(now.getDate() - daysToMonday);
          from.setHours(0, 0, 0, 0);

          to = new Date(from);
          to.setDate(from.getDate() + 6); // Sunday
          to.setHours(23, 59, 59, 999);
          break;

        case "MONTHLY":
          // Current month (1st to last day)
          from = new Date(now.getFullYear(), now.getMonth(), 1);
          from.setHours(0, 0, 0, 0);

          to = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
          to.setHours(23, 59, 59, 999);
          break;

        case "QUARTERLY":
          // Current quarter
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const quarterStartMonth = currentQuarter * 3;

          from = new Date(now.getFullYear(), quarterStartMonth, 1);
          from.setHours(0, 0, 0, 0);

          to = new Date(now.getFullYear(), quarterStartMonth + 3, 0); // Last day of quarter
          to.setHours(23, 59, 59, 999);
          break;

        case "ANNUAL":
          // Current year (January 1st to December 31st)
          from = new Date(now.getFullYear(), 0, 1);
          from.setHours(0, 0, 0, 0);

          to = new Date(now.getFullYear(), 11, 31);
          to.setHours(23, 59, 59, 999);
          break;

        case "CUSTOM":
        default:
          // For custom reports, use last 30 days as default
          from = new Date(now);
          from.setDate(now.getDate() - 29); // 30 days including today
          from.setHours(0, 0, 0, 0);

          to = new Date(now);
          to.setHours(23, 59, 59, 999);
          break;
      }

      setDateRange({ from, to });
    }
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
                <SelectItem value="DAILY">Diario</SelectItem>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="MONTHLY">Mensual</SelectItem>
                <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                <SelectItem value="ANNUAL">Anual</SelectItem>
                <SelectItem value="CUSTOM">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label>
              {reportType === "DAILY" ? "Fecha del Reporte" : "Rango de Fechas"}
            </Label>
            {reportType === "DAILY" ? (
              <DatePicker
                value={singleDate}
                onChange={setSingleDate}
                placeholder="Seleccionar fecha"
                className="w-full"
              />
            ) : (
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
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

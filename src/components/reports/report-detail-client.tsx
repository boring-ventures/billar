"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Printer,
  FileDown,
  Share2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { generateReportPDF } from "@/lib/pdf-utils";
import { format } from "date-fns";

interface Company {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Report {
  id: string;
  name: string;
  reportType: string;
  startDate: string;
  endDate: string;
  salesIncome: string;
  tableRentIncome: string;
  otherIncome: string;
  totalIncome: string;
  inventoryCost: string;
  maintenanceCost: string;
  staffCost: string;
  utilityCost: string;
  otherExpenses: string;
  totalExpense: string;
  netProfit: string;
  generatedAt: string;
  company?: Company;
  generatedBy?: Profile;
}

interface ReportDetailProps {
  report: Report;
}

export function ReportDetailClient({ report }: ReportDetailProps) {
  const router = useRouter();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleExportToPDF = () => {
    setIsExporting(true);

    try {
      // Generate PDF
      const doc = generateReportPDF(report);

      // Save the PDF file with date in the filename
      doc.save(
        `reporte-${report.name.replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`
      );

      toast({
        title: "Éxito",
        description: "Reporte exportado a PDF exitosamente",
      });
    } catch (error) {
      console.error("Error exporting report to PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte a PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Format report type for display
  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "DAILY":
        return "Diario";
      case "WEEKLY":
        return "Semanal";
      case "MONTHLY":
        return "Mensual";
      case "QUARTERLY":
        return "Trimestral";
      case "ANNUAL":
        return "Anual";
      case "CUSTOM":
        return "Personalizado";
      default:
        return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back button and actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="print:hidden"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "Imprimiendo..." : "Imprimir"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportToPDF}
            disabled={isExporting}
          >
            <FileDown className="w-4 h-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar a PDF"}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Compartir
          </Button>
        </div>
      </div>

      {/* Report Title and Info */}
      <div className="text-center py-4 print:py-6">
        <h1 className="text-3xl font-bold mb-2">{report.name}</h1>
        <p className="text-muted-foreground">
          {report.company?.name} • {getReportTypeLabel(report.reportType)} •{" "}
          {new Date(report.startDate).toLocaleDateString()} -{" "}
          {new Date(report.endDate).toLocaleDateString()}
        </p>
      </div>

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
              {formatCurrency(report.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todos los ingresos del periodo
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
              {formatCurrency(report.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todos los gastos del periodo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            {Number(report.netProfit) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                Number(report.netProfit) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {formatCurrency(report.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos - Gastos</p>
          </CardContent>
        </Card>
      </div>

      {/* Income & Expense Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Ingresos</CardTitle>
            <CardDescription>Detalle de fuentes de ingresos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Ventas (POS)</span>
              <span className="text-sm">
                {formatCurrency(report.salesIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Renta de Mesas</span>
              <span className="text-sm">
                {formatCurrency(report.tableRentIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Otros Ingresos</span>
              <span className="text-sm">
                {formatCurrency(report.otherIncome)}
              </span>
            </div>
            <div className="pt-2 border-t flex justify-between items-center font-bold">
              <span>Total</span>
              <span>{formatCurrency(report.totalIncome)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desglose de Gastos</CardTitle>
            <CardDescription>Detalle de gastos operativos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Inventario</span>
              <span className="text-sm">
                {formatCurrency(report.inventoryCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Mantenimiento</span>
              <span className="text-sm">
                {formatCurrency(report.maintenanceCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Personal</span>
              <span className="text-sm">
                {formatCurrency(report.staffCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Servicios</span>
              <span className="text-sm">
                {formatCurrency(report.utilityCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Otros Gastos</span>
              <span className="text-sm">
                {formatCurrency(report.otherExpenses)}
              </span>
            </div>
            <div className="pt-2 border-t flex justify-between items-center font-bold">
              <span>Total</span>
              <span>{formatCurrency(report.totalExpense)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Metadatos del Reporte</CardTitle>
          <CardDescription>
            Información adicional sobre el reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Información General</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID:</span>
                  <span className="text-sm font-mono">{report.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Empresa:
                  </span>
                  <span className="text-sm">{report.company?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <Badge variant="outline">
                    {getReportTypeLabel(report.reportType)}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Fechas</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Inicio:</span>
                  <span className="text-sm">
                    {new Date(report.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fin:</span>
                  <span className="text-sm">
                    {new Date(report.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Generado:
                  </span>
                  <span className="text-sm">
                    {new Date(report.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div>
            <h3 className="text-sm font-medium mb-2">Generado Por</h3>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Usuario:</span>
              <span className="text-sm">
                {report.generatedBy?.firstName} {report.generatedBy?.lastName}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

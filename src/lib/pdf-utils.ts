import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Extended jsPDF type to include lastAutoTable property from autotable plugin
interface ExtendedJsPdf extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Define proper types to replace any
interface OrderItem {
  item?: {
    name: string;
    id?: string;
    sku?: string | null;
  };
  quantity: number;
  unitPrice: number;
  id?: string;
  orderId?: string;
  itemId?: string;
}

interface TableSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalCost: number | null;
  table: {
    id: string;
    name: string;
    hourlyRate?: number | null;
  };
}

interface Staff {
  id?: string;
  userId?: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface Company {
  id?: string;
  name?: string;
}

interface Order {
  id: string;
  createdAt: string | Date;
  companyId?: string;
  staffId?: string | null;
  company?: Company;
  paymentStatus: string;
  paymentMethod: string;
  tableSession?: TableSession;
  staff?: Staff;
  orderItems: OrderItem[];
  amount?: number | null;
  updatedAt?: string;
}

// Brand colors from globals.css
const brandColors = {
  primary: [239, 68, 68] as [number, number, number], // Red from --primary (0 84% 60%)
  secondary: [34, 197, 94] as [number, number, number], // Green from --secondary (142 76% 36%)
  accent: [239, 68, 68] as [number, number, number],
  background: [255, 255, 255] as [number, number, number], // White or dark mode [25, 25, 25]
  foreground: [10, 10, 10] as [number, number, number], // Dark text or light mode [250, 250, 250]
  muted: [245, 245, 245] as [number, number, number], // Light gray background
  mutedForeground: [115, 115, 115] as [number, number, number], // Muted text
  border: [229, 229, 229] as [number, number, number], // Border color
  tableHeaderBg: [239, 68, 68] as [number, number, number], // Primary color for table headers
  tableHeaderText: [255, 255, 255] as [number, number, number], // White text on header
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `Bs. ${Number(amount).toFixed(2)}`;
};

// Add logo to PDF document
const addLogoToPdf = (doc: jsPDF) => {
  // Calculate dimensions for the logo
  const logoSize = 15; // Half the previous size (30)
  const pageWidth = doc.internal.pageSize.width;

  // Logo is positioned at the top right
  const logoX = pageWidth - logoSize - 15;
  const logoY = 15;

  // Use the PNG logo file from public directory
  const logoPath = "/brand-assets/logo.png";
  doc.addImage(logoPath, "PNG", logoX, logoY, logoSize, logoSize);
};

// Add common header to PDF document
const addHeaderToPdf = (doc: jsPDF, title: string) => {
  // Add logo
  addLogoToPdf(doc);

  // Add company name and title
  doc.setFontSize(22);
  doc.setTextColor(
    brandColors.primary[0],
    brandColors.primary[1],
    brandColors.primary[2]
  );
  doc.text("BILLARPRO", 15, 25);

  doc.setFontSize(18);
  doc.setTextColor(
    brandColors.foreground[0],
    brandColors.foreground[1],
    brandColors.foreground[2]
  );
  doc.text(title, 15, 40);

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(
    brandColors.mutedForeground[0],
    brandColors.mutedForeground[1],
    brandColors.mutedForeground[2]
  );
  doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 15, 48);

  // Add a separator line
  doc.setDrawColor(
    brandColors.border[0],
    brandColors.border[1],
    brandColors.border[2]
  );
  doc.line(15, 52, doc.internal.pageSize.width - 15, 52);

  return 60; // Return the Y position after the header
};

// Generate PDF for a single order
export const generateOrderPDF = (order: Order) => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add header
  const startY = addHeaderToPdf(doc, "Factura de Orden");

  // Add order details
  doc.setFontSize(12);
  doc.setTextColor(
    brandColors.foreground[0],
    brandColors.foreground[1],
    brandColors.foreground[2]
  );
  doc.text(`Orden #: ${order.id.substring(0, 8)}`, 15, startY);
  doc.text(
    `Fecha: ${format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}`,
    15,
    startY + 7
  );
  doc.text(`Empresa: ${order.company?.name || "-"}`, 15, startY + 14);
  doc.text(
    `Estado: ${order.paymentStatus === "PAID" ? "Pagado" : "Pendiente"}`,
    15,
    startY + 21
  );
  doc.text(
    `Método de pago: ${getPaymentMethodText(order.paymentMethod)}`,
    15,
    startY + 28
  );

  let currentY = startY + 28;

  // Add table information if available
  if (order.tableSession) {
    currentY += 7;
    doc.text(`Mesa: ${order.tableSession.table.name}`, 15, currentY);
    if (order.tableSession.totalCost) {
      currentY += 7;
      doc.text(
        `Costo de sesión: ${formatCurrency(order.tableSession.totalCost)}`,
        15,
        currentY
      );
    }
  }

  // Staff information if available
  if (order.staff) {
    currentY += 7;
    const staffName =
      `${order.staff.firstName || ""} ${order.staff.lastName || ""}`.trim() ||
      "Usuario";
    doc.text(`Ejecutado por: ${staffName}`, 15, currentY);
  }

  // Add items table
  currentY += 15;

  if (order.orderItems && order.orderItems.length > 0) {
    // Table header and data
    const headers = [["Ítem", "Cantidad", "Precio Unitario", "Subtotal"]];
    const data = order.orderItems.map((item: OrderItem) => [
      item.item?.name || "Ítem Desconocido",
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity * item.unitPrice),
    ]);

    // Generate table with brand colors
    autoTable(doc, {
      startY: currentY,
      head: headers,
      body: data,
      theme: "grid",
      headStyles: {
        fillColor: brandColors.tableHeaderBg,
        textColor: brandColors.tableHeaderText,
      },
      margin: { top: 15 },
    });

    // Add total
    const finalY = (doc as ExtendedJsPdf).lastAutoTable.finalY + 10;

    // Calculate proper total
    const productAmount = Number(order.amount || 0);
    const sessionCost = Number(order.tableSession?.totalCost || 0);
    const actualTotal = productAmount + sessionCost;

    // Show subtotals and total
    if (order.tableSession?.totalCost) {
      doc.text("Subtotal mesa:", 130, finalY);
      doc.text(formatCurrency(sessionCost), 175, finalY, { align: "right" });

      doc.text("Subtotal productos:", 130, finalY + 7);
      doc.text(formatCurrency(productAmount), 175, finalY + 7, {
        align: "right",
      });

      doc.text("Total:", 130, finalY + 14);
      doc.setTextColor(
        brandColors.primary[0],
        brandColors.primary[1],
        brandColors.primary[2]
      );
      doc.text(formatCurrency(actualTotal), 175, finalY + 14, {
        align: "right",
      });
      doc.setTextColor(
        brandColors.foreground[0],
        brandColors.foreground[1],
        brandColors.foreground[2]
      );
    } else {
      doc.text("Total:", 130, finalY);
      doc.setTextColor(
        brandColors.primary[0],
        brandColors.primary[1],
        brandColors.primary[2]
      );
      doc.text(formatCurrency(productAmount), 175, finalY, { align: "right" });
      doc.setTextColor(
        brandColors.foreground[0],
        brandColors.foreground[1],
        brandColors.foreground[2]
      );
    }
  } else {
    doc.text("No hay ítems en esta orden", 15, currentY + 10);
  }

  // Add footer
  addFooterToPdf(doc);

  return doc;
};

// Generate PDF for multiple orders (new function)
export const generateMultipleOrdersPDF = (orders: Order[]) => {
  if (!orders || orders.length === 0) {
    throw new Error("No hay órdenes para exportar");
  }

  // Create a new PDF document
  const doc = new jsPDF();

  // Add header to first page
  let startY = addHeaderToPdf(doc, `Órdenes (${orders.length})`);

  // Loop through each order
  orders.forEach((order, index) => {
    // If not the first order, add a new page
    if (index > 0) {
      doc.addPage();
      startY = addHeaderToPdf(doc, `Orden ${index + 1} de ${orders.length}`);
    }

    // Add order details
    doc.setFontSize(12);
    doc.setTextColor(
      brandColors.foreground[0],
      brandColors.foreground[1],
      brandColors.foreground[2]
    );
    doc.text(`Orden #: ${order.id.substring(0, 8)}`, 15, startY);
    doc.text(
      `Fecha: ${format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}`,
      15,
      startY + 7
    );
    doc.text(`Empresa: ${order.company?.name || "-"}`, 15, startY + 14);
    doc.text(
      `Estado: ${order.paymentStatus === "PAID" ? "Pagado" : "Pendiente"}`,
      15,
      startY + 21
    );
    doc.text(
      `Método de pago: ${getPaymentMethodText(order.paymentMethod)}`,
      15,
      startY + 28
    );

    let currentY = startY + 28;

    // Add table information if available
    if (order.tableSession) {
      currentY += 7;
      doc.text(`Mesa: ${order.tableSession.table.name}`, 15, currentY);
      if (order.tableSession.totalCost) {
        currentY += 7;
        doc.text(
          `Costo de sesión: ${formatCurrency(order.tableSession.totalCost)}`,
          15,
          currentY
        );
      }
    }

    // Staff information if available
    if (order.staff) {
      currentY += 7;
      const staffName =
        `${order.staff.firstName || ""} ${order.staff.lastName || ""}`.trim() ||
        "Usuario";
      doc.text(`Ejecutado por: ${staffName}`, 15, currentY);
    }

    // Add items table
    currentY += 15;

    if (order.orderItems && order.orderItems.length > 0) {
      // Table header and data
      const headers = [["Ítem", "Cantidad", "Precio Unitario", "Subtotal"]];
      const data = order.orderItems.map((item: OrderItem) => [
        item.item?.name || "Ítem Desconocido",
        item.quantity.toString(),
        formatCurrency(item.unitPrice),
        formatCurrency(item.quantity * item.unitPrice),
      ]);

      // Generate table with brand colors
      autoTable(doc, {
        startY: currentY,
        head: headers,
        body: data,
        theme: "grid",
        headStyles: {
          fillColor: brandColors.tableHeaderBg,
          textColor: brandColors.tableHeaderText,
        },
        margin: { top: 15 },
      });

      // Add total
      const finalY = (doc as ExtendedJsPdf).lastAutoTable.finalY + 10;

      // Calculate proper total
      const productAmount = Number(order.amount || 0);
      const sessionCost = Number(order.tableSession?.totalCost || 0);
      const actualTotal = productAmount + sessionCost;

      // Show subtotals and total
      if (order.tableSession?.totalCost) {
        doc.text("Subtotal mesa:", 130, finalY);
        doc.text(formatCurrency(sessionCost), 175, finalY, { align: "right" });

        doc.text("Subtotal productos:", 130, finalY + 7);
        doc.text(formatCurrency(productAmount), 175, finalY + 7, {
          align: "right",
        });

        doc.text("Total:", 130, finalY + 14);
        doc.setTextColor(
          brandColors.primary[0],
          brandColors.primary[1],
          brandColors.primary[2]
        );
        doc.text(formatCurrency(actualTotal), 175, finalY + 14, {
          align: "right",
        });
        doc.setTextColor(
          brandColors.foreground[0],
          brandColors.foreground[1],
          brandColors.foreground[2]
        );
      } else {
        doc.text("Total:", 130, finalY);
        doc.setTextColor(
          brandColors.primary[0],
          brandColors.primary[1],
          brandColors.primary[2]
        );
        doc.text(formatCurrency(productAmount), 175, finalY, {
          align: "right",
        });
        doc.setTextColor(
          brandColors.foreground[0],
          brandColors.foreground[1],
          brandColors.foreground[2]
        );
      }
    } else {
      doc.text("No hay ítems en esta orden", 15, currentY + 10);
    }

    // Add footer to each page
    addFooterToPdf(doc);
  });

  return doc;
};

// Generate PDF for a financial report
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateReportPDF = (report: any) => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add header
  const startY = addHeaderToPdf(doc, "Reporte Financiero");

  // Add report info
  doc.setFontSize(12);
  doc.setTextColor(
    brandColors.foreground[0],
    brandColors.foreground[1],
    brandColors.foreground[2]
  );
  doc.text(`Reporte: ${report.name}`, 15, startY);
  doc.text(
    `Período: ${format(new Date(report.startDate), "dd/MM/yyyy")} - ${format(new Date(report.endDate), "dd/MM/yyyy")}`,
    15,
    startY + 7
  );
  doc.text(`Tipo: ${getReportTypeText(report.reportType)}`, 15, startY + 14);
  doc.text(
    `Generado: ${format(new Date(report.generatedAt), "dd/MM/yyyy HH:mm")}`,
    15,
    startY + 21
  );

  // Income section
  doc.setFontSize(14);
  doc.setTextColor(
    brandColors.primary[0],
    brandColors.primary[1],
    brandColors.primary[2]
  );
  doc.text("Ingresos", 15, startY + 35);
  doc.setFontSize(12);
  doc.setTextColor(
    brandColors.foreground[0],
    brandColors.foreground[1],
    brandColors.foreground[2]
  );

  // Convert values to numbers if they are strings
  const salesIncome = Number(report.salesIncome);
  const tableRentIncome = Number(report.tableRentIncome);
  const otherIncome = Number(report.otherIncome);
  const totalIncome = Number(report.totalIncome);
  const inventoryCost = Number(report.inventoryCost);
  const maintenanceCost = Number(report.maintenanceCost);
  const staffCost = Number(report.staffCost);
  const utilityCost = Number(report.utilityCost);
  const otherExpenses = Number(report.otherExpenses);
  const totalExpense = Number(report.totalExpense);
  const netProfit = Number(report.netProfit);

  // Income table
  const incomeData = [
    ["Ventas (POS)", formatCurrency(salesIncome)],
    ["Renta de Mesas", formatCurrency(tableRentIncome)],
    ["Otros Ingresos", formatCurrency(otherIncome)],
    ["Total Ingresos", formatCurrency(totalIncome)],
  ];

  autoTable(doc, {
    startY: startY + 40,
    head: [["Concepto", "Monto"]],
    body: incomeData,
    theme: "grid",
    headStyles: {
      fillColor: brandColors.tableHeaderBg,
      textColor: brandColors.tableHeaderText,
    },
    bodyStyles: {},
    footStyles: {
      fillColor: brandColors.tableHeaderBg,
      textColor: brandColors.tableHeaderText,
    },
  });

  // Expense section
  const expenseY = (doc as ExtendedJsPdf).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(
    brandColors.primary[0],
    brandColors.primary[1],
    brandColors.primary[2]
  );
  doc.text("Gastos", 15, expenseY);
  doc.setFontSize(12);
  doc.setTextColor(
    brandColors.foreground[0],
    brandColors.foreground[1],
    brandColors.foreground[2]
  );

  // Expense table
  const expenseData = [
    ["Inventario (Venta)", formatCurrency(inventoryCost)],
    ["Mantenimiento", formatCurrency(maintenanceCost)],
    ["Personal", formatCurrency(staffCost)],
    ["Servicios", formatCurrency(utilityCost)],
    ["Uso Interno", formatCurrency(otherExpenses)],
    ["Total Gastos", formatCurrency(totalExpense)],
  ];

  autoTable(doc, {
    startY: expenseY + 5,
    head: [["Concepto", "Monto"]],
    body: expenseData,
    theme: "grid",
    headStyles: {
      fillColor: brandColors.tableHeaderBg,
      textColor: brandColors.tableHeaderText,
    },
    bodyStyles: {},
    footStyles: {
      fillColor: brandColors.tableHeaderBg,
      textColor: brandColors.tableHeaderText,
    },
  });

  // Summary section
  const summaryY = (doc as ExtendedJsPdf).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(
    brandColors.primary[0],
    brandColors.primary[1],
    brandColors.primary[2]
  );
  doc.text("Resumen", 15, summaryY);

  // Add final result
  doc.setFontSize(12);
  doc.setTextColor(
    brandColors.foreground[0],
    brandColors.foreground[1],
    brandColors.foreground[2]
  );
  doc.text("Ganancia Neta:", 15, summaryY + 10);
  doc.setTextColor(netProfit >= 0 ? 0 : 255, netProfit >= 0 ? 128 : 0, 0);
  doc.text(formatCurrency(netProfit), 75, summaryY + 10);
  doc.setTextColor(
    brandColors.foreground[0],
    brandColors.foreground[1],
    brandColors.foreground[2]
  );

  // Add footer
  addFooterToPdf(doc);

  return doc;
};

// Add footer to PDF
const addFooterToPdf = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(
      brandColors.mutedForeground[0],
      brandColors.mutedForeground[1],
      brandColors.mutedForeground[2]
    );

    // Add footer line
    doc.setDrawColor(
      brandColors.border[0],
      brandColors.border[1],
      brandColors.border[2]
    );
    doc.line(
      15,
      doc.internal.pageSize.height - 20,
      doc.internal.pageSize.width - 15,
      doc.internal.pageSize.height - 20
    );

    // Add page number
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );

    // Add company info
    doc.text(
      "BILLARPRO - Sistema de Gestión",
      15,
      doc.internal.pageSize.height - 10
    );
  }
};

// Helper function to convert payment method to text
const getPaymentMethodText = (method: string) => {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "QR":
      return "Pago QR";
    case "CREDIT_CARD":
      return "Tarjeta de Crédito";
    default:
      return method;
  }
};

// Helper function to convert report type to text
const getReportTypeText = (type: string) => {
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

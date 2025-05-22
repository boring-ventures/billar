export const metadata = {
  title: "Reportes Financieros",
  description: "Gestión de reportes financieros y análisis de datos",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto py-4">{children}</div>;
}

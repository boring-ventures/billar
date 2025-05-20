"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  DollarSign,
  Package,
  ShieldCheck,
  Table,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentTableSessions } from "@/components/dashboard/recent-table-sessions";
import { LowStockItems } from "@/components/dashboard/low-stock-items";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { SalesSummaryChart } from "@/components/dashboard/sales-summary-chart";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoadingUser && !user) {
      router.push("/sign-in");
    }
  }, [isLoadingUser, user, router]);

  // Loading state
  if (isLoadingUser) {
    return (
      <div className="flex flex-col space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-5 w-full max-w-[600px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
        </div>
      </div>
    );
  }

  // Super admin view (no company)
  if (!profile?.companyId) {
    return (
      <div className="flex flex-col space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Panel de Control
          </h2>
          <p className="text-muted-foreground">
            Bienvenido, {profile?.firstName || "Administrador"}. Acceso de Super
            Admin.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estado del Sistema
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Activo</div>
              <p className="text-xs text-muted-foreground">
                Sistema funcionando normalmente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/companies">Administrar Empresas</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/users">Administrar Usuarios</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Selecciona una empresa para gestionar sus datos específicos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
        <p className="text-muted-foreground">
          Bienvenido, {profile.firstName || "Usuario"}. Aquí tienes un resumen
          de la actividad reciente de {profile.companyId ? "tu empresa" : ""}.
        </p>
      </div>

      {isLoadingStats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="tables">Mesas</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ventas de Hoy
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.todaySales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% desde ayer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mesas Activas
                  </CardTitle>
                  <Table className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.activeSessionsCount || 0} /{" "}
                    {stats?.tablesCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(
                      ((stats?.activeSessionsCount || 0) /
                        (stats?.tablesCount || 1)) *
                        100
                    )}
                    % ocupación
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Inventario Bajo
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.lowStockItemsCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(stats?.inventoryItemsCount || 0) > 0
                      ? `${Math.round(((stats?.lowStockItemsCount || 0) / (stats?.inventoryItemsCount || 1)) * 100)}% del inventario`
                      : "No hay artículos"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ventas del Mes
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.monthSales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +15% desde el mes pasado
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Resumen de Ventas</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <SalesSummaryChart companyId={profile.companyId} />
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Órdenes Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentOrders companyId={profile.companyId} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Sesiones de Mesa Activas</CardTitle>
                  <CardDescription>
                    {stats?.activeSessionsCount || 0} mesas ocupadas actualmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentTableSessions
                    companyId={profile.companyId}
                    activeOnly={true}
                  />
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/tables?tab=sessions">
                      Ver Todas las Sesiones Activas
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Mesas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 rounded-full bg-green-500" />
                      <div className="flex-1 text-sm font-medium">
                        Disponibles
                      </div>
                      <div className="text-right text-sm font-medium">
                        {(stats?.tablesCount || 0) -
                          (stats?.activeSessionsCount || 0)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 rounded-full bg-amber-500" />
                      <div className="flex-1 text-sm font-medium">Ocupadas</div>
                      <div className="text-right text-sm font-medium">
                        {stats?.activeSessionsCount || 0}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 rounded-full bg-red-500" />
                      <div className="flex-1 text-sm font-medium">
                        Mantenimiento
                      </div>
                      <div className="text-right text-sm font-medium">0</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button asChild className="w-full">
                      <Link href="/tables">Administrar Mesas</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Artículos con Stock Bajo</CardTitle>
                    <CardDescription>
                      Se necesita reposición de inventario
                    </CardDescription>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <LowStockItems companyId={profile.companyId} />
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/inventory?tab=low-stock">
                      Ver Todos los Artículos con Stock Bajo
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Inventario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Total de Artículos
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {stats?.inventoryItemsCount || 0}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">Stock Bajo</span>
                      </div>
                      <div className="text-sm font-medium">
                        {stats?.lowStockItemsCount || 0}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button asChild className="w-full">
                      <Link href="/inventory">Gestionar Inventario</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Órdenes Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentOrders companyId={profile.companyId} />
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/pos">Ver Historial Completo</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento de Ventas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Ventas de Hoy
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(stats?.todaySales || 0)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Ventas del Mes
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(stats?.monthSales || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button asChild className="w-full">
                      <Link href="/reports">Ver Reportes Completos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

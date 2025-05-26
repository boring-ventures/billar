"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  Building2,
  Shield,
  Mail,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { UserRole } from "@prisma/client";

export function AccountSection() {
  const { profile, user } = useCurrentUser();

  if (!profile || !user) return null;

  // Format user creation date
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Format profile creation date
  const profileCreatedAt = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Get role display name and description
  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case UserRole.SELLER:
        return {
          name: "Vendedor",
          description: "Acceso a gestión de mesas, inventario y ventas",
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case UserRole.ADMIN:
        return {
          name: "Administrador",
          description: "Acceso completo a la gestión de la empresa",
          color: "bg-green-50 text-green-700 border-green-200",
        };
      case UserRole.SUPERADMIN:
        return {
          name: "Super Administrador",
          description: "Acceso total al sistema y gestión de usuarios",
          color: "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return {
          name: role,
          description: "Rol personalizado",
          color: "bg-gray-50 text-gray-700 border-gray-200",
        };
    }
  };

  const roleInfo = getRoleInfo(profile.role);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información de la Cuenta
        </CardTitle>
        <CardDescription>
          Detalles sobre tu cuenta, perfil y permisos en el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Información Básica
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Nombre Completo</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.firstName && profile.lastName
                      ? `${profile.firstName} ${profile.lastName}`
                      : "No configurado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {profile.active ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <div>
                  <p className="text-sm font-medium">Estado de la Cuenta</p>
                  <Badge
                    variant="outline"
                    className={
                      profile.active
                        ? "bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
                        : "bg-red-50 text-red-700 hover:bg-red-50 border-red-200"
                    }
                  >
                    {profile.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Información del Sistema
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Rol y Permisos</p>
                  <Badge variant="outline" className={roleInfo.color}>
                    {roleInfo.name}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {roleInfo.description}
                  </p>
                </div>
              </div>

              {profile.companyId && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Empresa</p>
                    <p className="text-sm text-muted-foreground">
                      Asociado a una empresa
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Miembro desde</p>
                  <p className="text-sm text-muted-foreground">{createdAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info for Admins */}
        {(profile.role === UserRole.ADMIN ||
          profile.role === UserRole.SUPERADMIN) && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Información Administrativa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">ID de Usuario</p>
                <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                  {profile.userId}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Perfil Creado</p>
                <p className="text-sm text-muted-foreground">
                  {profileCreatedAt}
                </p>
              </div>

              {profile.companyId && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">ID de Empresa</p>
                  <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                    {profile.companyId}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium">Última Actualización</p>
                <p className="text-sm text-muted-foreground">
                  {profile.updatedAt
                    ? new Date(profile.updatedAt).toLocaleDateString("es-ES")
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Role-specific features info */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Funcionalidades Disponibles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.role === UserRole.SELLER && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Gestión de Mesas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Gestión de Inventario</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Punto de Venta</span>
                </div>
              </>
            )}

            {profile.role === UserRole.ADMIN && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Todas las funciones de Vendedor</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Gestión de Empresa</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Reportes Financieros</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Gestión de Empleados</span>
                </div>
              </>
            )}

            {profile.role === UserRole.SUPERADMIN && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Acceso Total al Sistema</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Gestión de Usuarios</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Gestión de Empresas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Configuración del Sistema</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

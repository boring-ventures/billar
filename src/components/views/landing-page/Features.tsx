import {
  LayoutDashboard,
  Table,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  Settings,
  Clock,
  DollarSign,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TickingCounter } from "@/components/magicui/ticking-counter";

export default function Features() {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Panel de Control Inteligente",
      description:
        "Dashboard completo con métricas en tiempo real: ventas diarias, ocupación de mesas, inventario bajo stock y resumen de actividad. Todo lo que necesitas ver de un vistazo.",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: Table,
      title: "Gestión Avanzada de Mesas",
      description:
        "Control total de mesas con vista de cuadrícula y lista. Inicia/termina sesiones, monitorea tiempo de uso, gestiona reservas y calcula tarifas automáticamente por hora.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: Package,
      title: "Inventario Inteligente",
      description:
        "Gestiona productos de venta e uso interno con categorías personalizadas. Alertas automáticas de stock bajo, control de precios y seguimiento de movimientos de inventario.",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: ShoppingCart,
      title: "Punto de Venta Completo",
      description:
        "Sistema POS integrado para vender bebidas, snacks y accesorios. Historial de órdenes, gestión de productos y procesamiento de pagos en una sola plataforma.",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      icon: Receipt,
      title: "Control de Gastos",
      description:
        "Registra y categoriza todos los gastos operativos: servicios, mantenimiento, compras. Seguimiento detallado con fechas, descripciones y notas para control financiero total.",
      color: "bg-red-500/10 text-red-500",
    },
    {
      icon: BarChart3,
      title: "Reportes Financieros",
      description:
        "Genera reportes detallados de ingresos por mesas, ventas de productos, gastos operativos y análisis de rentabilidad. Exporta datos para análisis avanzado.",
      color: "bg-cyan-500/10 text-cyan-500",
    },
    {
      icon: Users,
      title: "Gestión de Usuarios",
      description:
        "Administra empleados con roles específicos (Admin, Vendedor). Control de acceso por módulos, gestión de empresas múltiples y perfiles personalizados.",
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      icon: Settings,
      title: "Configuración Avanzada",
      description:
        "Personaliza tu perfil, configuración de empresa, seguridad de cuenta y preferencias del sistema. Cambio de contraseñas y gestión de datos empresariales.",
      color: "bg-teal-500/10 text-teal-500",
    },
    {
      icon: Clock,
      title: "Sesiones en Tiempo Real",
      description:
        "Monitoreo en vivo de todas las sesiones activas con cronómetros automáticos. Calcula tarifas por minuto/hora y genera facturas precisas al finalizar.",
      color: "bg-indigo-500/10 text-indigo-500",
    },
    {
      icon: DollarSign,
      title: "Análisis de Ingresos",
      description:
        "Seguimiento detallado de ingresos por fuente: alquiler de mesas, ventas de productos, servicios adicionales. Métricas de rendimiento y tendencias de crecimiento.",
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      icon: AlertTriangle,
      title: "Alertas Inteligentes",
      description:
        "Notificaciones automáticas para stock bajo, mesas que requieren mantenimiento, sesiones prolongadas y recordatorios de tareas importantes.",
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      icon: TrendingUp,
      title: "Analytics Avanzado",
      description:
        "Análisis de tendencias de uso, horas pico, productos más vendidos, rentabilidad por mesa y métricas de desempeño para optimizar tu negocio.",
      color: "bg-violet-500/10 text-violet-500",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 bg-[#191919] relative overflow-hidden"
    >
      {/* Subtle diagonal pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#252525_1px,transparent_1px),linear-gradient(to_bottom,#252525_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>

      {/* Colored glow effects */}
      <div className="absolute top-20 left-20 w-1/3 h-1/3 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-20 w-1/3 h-1/3 bg-green-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-red-500 font-medium mb-2">Plataforma Completa</p>
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
            Todos los Módulos que Necesitas Para Tu Salón de Billar
          </h2>
          <p className="text-xl text-gray-400">
            BILLARPRO integra 8+ módulos especializados en una sola plataforma
            para gestionar cada aspecto de tu negocio
          </p>

          <div className="flex justify-center gap-10 mt-8">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <TickingCounter
                  className="text-3xl font-bold text-red-500"
                  from={0}
                  to={8}
                  duration={2.5}
                />
                <span className="text-3xl font-bold text-red-500">+</span>
              </div>
              <p className="text-sm text-gray-500">Módulos integrados</p>
            </div>
            <div className="text-center">
              <TickingCounter
                className="text-3xl font-bold text-green-500"
                from={0}
                to={50}
                duration={2.5}
                suffix="%"
              />
              <p className="text-sm text-gray-500">
                Menos tiempo administrativo
              </p>
            </div>
            <div className="text-center">
              <TickingCounter
                className="text-3xl font-bold text-blue-500"
                from={0}
                to={35}
                duration={2.5}
                suffix="%"
              />
              <p className="text-sm text-gray-500">Aumento en eficiencia</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {features.map((feature, i) => (
            <BlurFade key={feature.title} delay={i * 0.1}>
              <div className="relative group">
                <div className="flex flex-col h-full p-6 bg-gray-900 rounded-2xl shadow-md border border-gray-800 hover:border-red-500/50 dark:hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-105">
                  {/* Subtle color accent in the corner */}
                  <div
                    className={`absolute -top-1 -right-1 w-16 h-16 rounded-full opacity-20 ${i % 3 === 0 ? "bg-red-500/30" : i % 3 === 1 ? "bg-green-500/30" : "bg-blue-500/30"} blur-xl -z-0`}
                  ></div>

                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 flex-grow text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Subtle accent line at the bottom */}
                  <div
                    className={`h-1 w-12 mt-4 rounded-full ${i % 3 === 0 ? "bg-red-500/50" : i % 3 === 1 ? "bg-green-500/50" : "bg-blue-500/50"}`}
                  ></div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>

        {/* Additional section highlighting key benefits */}
        <div className="mt-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              ¿Por qué elegir BILLARPRO?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LayoutDashboard className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Todo en Uno
                </h4>
                <p className="text-gray-400 text-sm">
                  No necesitas múltiples sistemas. BILLARPRO integra todo lo que
                  necesitas en una sola plataforma.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Tiempo Real
                </h4>
                <p className="text-gray-400 text-sm">
                  Monitoreo en vivo de mesas, inventario y ventas. Toma
                  decisiones basadas en datos actualizados.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Crecimiento
                </h4>
                <p className="text-gray-400 text-sm">
                  Analytics y reportes detallados te ayudan a identificar
                  oportunidades de crecimiento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

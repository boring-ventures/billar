import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  ShoppingCart,
  BarChart2,
  Users,
  Clock,
  ClipboardList,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TickingCounter } from "@/components/magicui/ticking-counter";

export default function Features() {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Gestión de Mesas",
      description:
        "Monitorea y administra todas tus mesas de billar en tiempo real. Controla el estado de las mesas, disponibilidad y maneja eficientemente los programas de mantenimiento.",
      color: "bg-red-500/10 text-red-500",
    },
    {
      icon: Calendar,
      title: "Sistema de Reservas",
      description:
        "Permite a los clientes reservar mesas con anticipación. Gestiona reservas con una interfaz de calendario intuitiva y previene reservas duplicadas.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: Clock,
      title: "Control de Tiempo",
      description:
        "Controla automáticamente el tiempo de uso de mesas con tarifas por hora precisas. Finaliza sesiones con un clic y genera facturas exactas.",
      color: "bg-red-500/10 text-red-500",
    },
    {
      icon: ShoppingCart,
      title: "Punto de Venta e Inventario",
      description:
        "Vende alimentos, bebidas y equipos con el sistema de punto de venta integrado. Controla niveles de inventario y recibe alertas de stock bajo.",
      color: "bg-green-500/20 text-green-500",
    },
    {
      icon: DollarSign,
      title: "Procesamiento de Pagos",
      description:
        "Acepta múltiples métodos de pago incluyendo efectivo, tarjetas de crédito y pagos por QR. Gestiona fácilmente facturas no pagadas y estados de pago.",
      color: "bg-red-500/20 text-red-500",
    },
    {
      icon: BarChart2,
      title: "Informes Financieros",
      description:
        "Genera informes financieros completos con desgloses de ingresos por alquiler de mesas, alimentos y bebidas, y otras fuentes de ingresos.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description:
        "Construye una base de datos de tus clientes habituales. Realiza seguimiento de preferencias, historial de reservas y crea programas de fidelización.",
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      icon: ClipboardList,
      title: "Gestión de Personal",
      description:
        "Administra cuentas de empleados con diferentes niveles de acceso. Controla el desempeño del personal y asignaciones de sesiones de mesa.",
      color: "bg-teal-500/10 text-teal-500",
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
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-red-500 font-medium mb-2">
            Características Poderosas
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
            Todo lo que Necesitas Para Tu Salón de Billar
          </h2>
          <p className="text-xl text-gray-400">
            Nuestra plataforma combina todas las herramientas esenciales en un
            único sistema
          </p>

          <div className="flex justify-center gap-10 mt-8">
            <div className="text-center">
              <TickingCounter
                className="text-3xl font-bold text-red-500"
                from={0}
                to={40}
                duration={2.5}
              />
              <p className="text-sm text-gray-500">
                Menos horas en trabajo administrativo
              </p>
            </div>
            <div className="text-center">
              <TickingCounter
                className="text-3xl font-bold text-green-500"
                from={0}
                to={30}
                duration={2.5}
                suffix="%"
              />
              <p className="text-sm text-gray-500">Aumento en ingresos</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {features.map((feature, i) => (
            <BlurFade key={feature.title} delay={i * 0.1}>
              <div className="relative group">
                <div className="flex flex-col h-full p-6 bg-gray-900 rounded-2xl shadow-md border border-gray-800 hover:border-red-500/50 dark:hover:border-green-500/50 transition-all duration-300">
                  {/* Subtle color accent in the corner */}
                  <div
                    className={`absolute -top-1 -right-1 w-16 h-16 rounded-full opacity-20 ${i % 2 === 0 ? "bg-red-500/30" : "bg-green-500/30"} blur-xl -z-0`}
                  ></div>

                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${feature.color}`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 flex-grow">
                    {feature.description}
                  </p>

                  {/* Subtle accent line at the bottom */}
                  <div
                    className={`h-1 w-12 mt-4 rounded-full ${i % 2 === 0 ? "bg-red-500/50" : "bg-green-500/50"}`}
                  ></div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

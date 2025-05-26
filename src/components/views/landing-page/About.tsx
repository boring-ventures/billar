import {
  CheckIcon,
  LayoutDashboard,
  Table,
  Package,
  ShoppingCart,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";

export default function About() {
  const benefits = [
    "8+ módulos integrados: Dashboard, Mesas, Inventario, POS, Gastos, Reportes, Usuarios y Configuración",
    "Gestión completa en tiempo real de todas las operaciones de tu salón",
    "Analytics avanzado con reportes financieros detallados y métricas de rendimiento",
    "Control de inventario inteligente con alertas automáticas de stock bajo",
    "Sistema POS integrado para maximizar ingresos por ventas adicionales",
    "Gestión de usuarios con roles específicos para tu equipo de trabajo",
    "Plataforma basada en la nube accesible desde cualquier dispositivo",
    "Actualizaciones continuas con nuevas funciones basadas en feedback real",
  ];

  const moduleHighlights = [
    {
      icon: LayoutDashboard,
      title: "Dashboard Inteligente",
      desc: "Métricas en tiempo real",
      color: "text-blue-500",
    },
    {
      icon: Table,
      title: "Gestión de Mesas",
      desc: "Control total de sesiones",
      color: "text-green-500",
    },
    {
      icon: Package,
      title: "Inventario Avanzado",
      desc: "Stock y categorías",
      color: "text-purple-500",
    },
    {
      icon: ShoppingCart,
      title: "POS Integrado",
      desc: "Ventas y facturación",
      color: "text-orange-500",
    },
  ];

  return (
    <section id="about" className="py-24 bg-[#121212] overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <BlurFade>
            <div className="relative">
              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <div className="aspect-[4/3] relative bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                  <div className="absolute w-full h-full flex items-center justify-center">
                    <div className="w-3/4 h-3/4 bg-gradient-to-br from-red-500/20 to-green-500/20 rounded-lg flex flex-col items-center justify-center p-6">
                      <span className="text-3xl font-bold text-white mb-2">
                        BILLARPRO
                      </span>
                      <span className="text-sm text-gray-300 text-center">
                        Plataforma Completa de Gestión
                      </span>

                      {/* Mini module icons */}
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {moduleHighlights.map((module, i) => (
                          <div
                            key={i}
                            className="flex flex-col items-center p-2 bg-gray-800/50 rounded-lg"
                          >
                            <module.icon
                              className={`h-4 w-4 ${module.color}`}
                            />
                            <span className="text-xs text-gray-400 mt-1 text-center">
                              {module.title.split(" ")[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-6 -right-6 bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 max-w-[260px]">
                <div className="text-2xl font-bold text-red-500 mb-1">
                  8+ Módulos
                </div>
                <div className="text-sm text-gray-400">
                  Todo lo que necesitas en una sola plataforma
                </div>
              </div>

              {/* Additional floating card */}
              <div className="absolute -top-6 -left-6 bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-800 max-w-[200px]">
                <div className="text-xl font-bold text-green-500 mb-1">
                  100%
                </div>
                <div className="text-xs text-gray-400">
                  Especializado para salones de billar
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 -top-6 -left-6 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
              <div className="absolute -z-10 -bottom-10 right-20 w-32 h-32 bg-green-500/10 rounded-full blur-xl"></div>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  La Solución Más Completa Para Tu Salón de Billar
                </h2>
                <p className="text-lg text-gray-400 mb-6">
                  BILLARPRO integra 8+ módulos especializados en una sola
                  plataforma. Desde el dashboard inteligente hasta reportes
                  financieros avanzados, gestiona cada aspecto de tu negocio con
                  la herramienta más completa del mercado.
                </p>
              </div>

              <ul className="space-y-3">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start">
                    <span
                      className={cn(
                        "flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full mr-3 mt-1",
                        "bg-red-500/20 text-red-500"
                      )}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span className="text-gray-300 text-sm leading-relaxed">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pt-6 space-y-4">
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-300 italic text-sm">
                    &ldquo;BILLARPRO transformó completamente la gestión de mi
                    salón. Tener todo integrado - desde el control de mesas
                    hasta los reportes financieros - me ahorra horas cada día y
                    me da insights que antes no tenía.&rdquo;
                  </p>
                  <div className="mt-3 text-sm text-gray-500 font-medium">
                    &mdash; Carlos M., Propietario de Billar Elite
                  </div>
                </div>

                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-300 italic text-sm">
                    &ldquo;El módulo de inventario y POS integrado aumentó
                    nuestras ventas adicionales en un 35%. La plataforma es
                    intuitiva y mi equipo la adoptó inmediatamente.&rdquo;
                  </p>
                  <div className="mt-3 text-sm text-gray-500 font-medium">
                    &mdash; Ana L., Gerente de Billar Central
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}

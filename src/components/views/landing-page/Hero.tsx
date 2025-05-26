"use client";

import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  Table,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { useAuth } from "@/providers/auth-provider";

export default function Hero() {
  const { user, session, isLoading } = useAuth();

  return (
    <section className="relative py-28 md:py-40 overflow-hidden bg-[#191919] text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#252525_1px,transparent_1px),linear-gradient(to_bottom,#252525_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      {/* Glow effects */}
      <div className="absolute top-1/3 -left-1/4 w-3/4 h-1/2 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 -right-1/4 w-3/4 h-1/2 bg-green-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-8 text-center">
              <BlurFade>
                <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-4 shadow-sm backdrop-blur-sm">
                  <span className="text-sm font-medium text-white">
                    <span className="text-green-500 font-semibold">
                      8+ Módulos
                    </span>{" "}
                    integrados por solo{" "}
                    <span className="text-red-500 font-semibold">$20</span>
                    /mes
                  </span>
                </div>
              </BlurFade>

              <BlurFade delay={0.1}>
                <AnimatedShinyText>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
                    La Plataforma Completa Para
                    <span className="block text-red-500 mt-2">
                      Tu Salón de Billar
                    </span>
                  </h1>
                </AnimatedShinyText>
              </BlurFade>

              <BlurFade delay={0.2}>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto mt-6">
                  Dashboard inteligente, gestión de mesas, inventario, POS,
                  control de gastos, reportes financieros, gestión de usuarios y
                  configuración avanzada. Todo lo que necesitas en una sola
                  plataforma.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                  {isLoading ? (
                    // Show loading state while checking authentication
                    <ShimmerButton shimmerColor="#ef4444">
                      <div className="inline-flex items-center px-8 py-3 text-lg font-medium">
                        <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                        Cargando...
                      </div>
                    </ShimmerButton>
                  ) : user && session ? (
                    // Show Dashboard button for authenticated users
                    <ShimmerButton shimmerColor="#ef4444">
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center px-8 py-3 text-lg font-medium"
                      >
                        <LayoutDashboard className="mr-2 h-5 w-5" />
                        Ir al Dashboard
                        <ArrowRight
                          className="ml-2 group-hover:translate-x-1 transition-transform"
                          size={20}
                        />
                      </Link>
                    </ShimmerButton>
                  ) : (
                    // Show Sign Up button for non-authenticated users
                    <ShimmerButton shimmerColor="#ef4444">
                      <Link
                        href="/sign-up"
                        className="inline-flex items-center px-8 py-3 text-lg font-medium"
                      >
                        Empezar Gratis
                        <ArrowRight
                          className="ml-2 group-hover:translate-x-1 transition-transform"
                          size={20}
                        />
                      </Link>
                    </ShimmerButton>
                  )}

                  <Link
                    href="/#features"
                    className="inline-flex items-center text-gray-300 hover:text-red-500 transition-colors px-8 py-3"
                  >
                    Ver Todos los Módulos
                  </Link>
                </div>
              </BlurFade>
            </div>

            {/* Enhanced modules showcase */}
            <div className="mt-20">
              <BlurFade delay={0.3}>
                <h3 className="text-2xl font-bold text-center text-white mb-8">
                  Módulos Principales Incluidos
                </h3>
              </BlurFade>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 max-w-6xl mx-auto">
                {[
                  {
                    icon: LayoutDashboard,
                    label: "Dashboard",
                    desc: "Panel de control",
                    color: "text-blue-500",
                  },
                  {
                    icon: Table,
                    label: "Mesas",
                    desc: "Gestión completa",
                    color: "text-green-500",
                  },
                  {
                    icon: Package,
                    label: "Inventario",
                    desc: "Control de stock",
                    color: "text-purple-500",
                  },
                  {
                    icon: ShoppingCart,
                    label: "POS",
                    desc: "Punto de venta",
                    color: "text-orange-500",
                  },
                  {
                    icon: Receipt,
                    label: "Gastos",
                    desc: "Control financiero",
                    color: "text-red-500",
                  },
                  {
                    icon: BarChart3,
                    label: "Reportes",
                    desc: "Analytics avanzado",
                    color: "text-cyan-500",
                  },
                  {
                    icon: Users,
                    label: "Usuarios",
                    desc: "Gestión de equipo",
                    color: "text-pink-500",
                  },
                  {
                    icon: Settings,
                    label: "Configuración",
                    desc: "Personalización",
                    color: "text-teal-500",
                  },
                ].map((module, i) => (
                  <BlurFade
                    key={module.label}
                    delay={i * 0.05 + 0.4}
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-800 bg-gray-800/30 backdrop-blur-sm hover:bg-gray-800/60 transition-all duration-300 hover:transform hover:scale-105"
                  >
                    <module.icon className={`h-6 w-6 mb-2 ${module.color}`} />
                    <div className="text-sm font-semibold text-white mb-1 text-center">
                      {module.label}
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      {module.desc}
                    </div>
                  </BlurFade>
                ))}
              </div>
            </div>

            {/* Key benefits */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: LayoutDashboard,
                  label: "Todo en Una Plataforma",
                  desc: "8+ módulos integrados sin complicaciones",
                  color: "text-red-500",
                },
                {
                  icon: BarChart3,
                  label: "Datos en Tiempo Real",
                  desc: "Métricas y analytics actualizados al instante",
                  color: "text-green-500",
                },
                {
                  icon: Users,
                  label: "Fácil de Usar",
                  desc: "Interfaz intuitiva para todo tu equipo",
                  color: "text-blue-500",
                },
              ].map((feature, i) => (
                <BlurFade
                  key={feature.label}
                  delay={i * 0.1 + 0.6}
                  className="flex flex-col items-center p-6 rounded-xl border border-gray-800 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-300"
                >
                  <feature.icon className={`h-8 w-8 mb-3 ${feature.color}`} />
                  <div className="text-lg font-semibold text-white mb-1 text-center">
                    {feature.label}
                  </div>
                  <div className="text-sm text-gray-400 text-center">
                    {feature.desc}
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#191919]"></div>
    </section>
  );
}

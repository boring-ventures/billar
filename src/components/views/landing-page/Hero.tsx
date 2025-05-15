import Link from "next/link";
import { ArrowRight, Clock, BarChart3, CreditCard } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

export default function Hero() {
  return (
    <section className="relative py-28 md:py-40 overflow-hidden bg-[#191919] text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#252525_1px,transparent_1px),linear-gradient(to_bottom,#252525_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      {/* Glow effects */}
      <div className="absolute top-1/3 -left-1/4 w-3/4 h-1/2 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 -right-1/4 w-3/4 h-1/2 bg-green-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-8 text-center">
              <BlurFade>
                <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-4 shadow-sm backdrop-blur-sm">
                  <span className="text-sm font-medium text-white">
                    Gestión todo-en-uno por{" "}
                    <span className="text-red-500 font-semibold">$20</span>
                    /mes
                  </span>
                </div>
              </BlurFade>

              <BlurFade delay={0.1}>
                <AnimatedShinyText>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
                    Administra Tu Salón de Billar
                    <span className="block text-red-500 mt-2">
                      Sin Complicaciones
                    </span>
                  </h1>
                </AnimatedShinyText>
              </BlurFade>

              <BlurFade delay={0.2}>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto mt-6">
                  Gestiona mesas, controla ingresos, maneja inventario, y mejora
                  tu negocio de billar con nuestra plataforma todo-en-uno
                  diseñada específicamente para propietarios de salones de
                  billar.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                  <ShimmerButton shimmerColor="#ef4444">
                    <Link
                      href="/sign-up"
                      className="inline-flex items-center px-8 py-3 text-lg font-medium"
                    >
                      Empezar Ahora
                      <ArrowRight
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                        size={20}
                      />
                    </Link>
                  </ShimmerButton>

                  <Link
                    href="/#pricing"
                    className="inline-flex items-center text-gray-300 hover:text-red-500 transition-colors px-8 py-3"
                  >
                    Ver Precios
                  </Link>
                </div>
              </BlurFade>
            </div>

            {/* Features highlight */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: Clock,
                  label: "Gestión de Mesas en Tiempo Real",
                  desc: "Seguimiento de uso y reservas de mesas",
                  color: "bg-gray-800 text-white",
                },
                {
                  icon: BarChart3,
                  label: "Análisis de Negocio",
                  desc: "Informes financieros completos",
                  color: "bg-red-500/10 text-red-500",
                },
                {
                  icon: CreditCard,
                  label: "Sistema de Punto de Venta",
                  desc: "Maneja pagos con facilidad",
                  color: "bg-green-500/10 text-green-500",
                },
              ].map((feature, i) => (
                <BlurFade
                  key={feature.label}
                  delay={i * 0.1 + 0.3}
                  className="flex flex-col items-center p-6 rounded-xl border border-gray-800 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-300"
                >
                  <feature.icon
                    className={`h-8 w-8 mb-3 ${i === 1 ? "text-red-500" : i === 2 ? "text-green-500" : "text-white"}`}
                  />
                  <div className="text-lg font-semibold text-white mb-1">
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

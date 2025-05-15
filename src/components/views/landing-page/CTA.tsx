import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { GlowingStarsBackgroundCard } from "@/components/magicui/glowing-stars-background";

export default function PricingCTA() {
  const features = [
    "Gestión ilimitada de mesas",
    "Sistema completo de punto de venta",
    "Seguimiento de inventario",
    "Gestión de reservas",
    "Informes financieros",
    "Base de datos de clientes",
    "Gestión de personal",
  ];

  return (
    <section
      id="pricing"
      className="py-24 bg-[#191919] relative overflow-hidden"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#212121]/50 to-[#191919] -z-10" />

      {/* Colored glow effects */}
      <div className="absolute top-40 left-20 w-1/2 h-1/3 bg-red-500/10 rounded-full blur-3xl -z-5"></div>
      <div className="absolute bottom-20 right-20 w-1/2 h-1/3 bg-green-500/10 rounded-full blur-3xl -z-5"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
            Precios Simples y Transparentes
          </h2>
          <p className="text-xl text-gray-400">
            Un plan asequible con todo lo que necesitas para administrar tu
            salón de billar de manera eficiente
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <GlowingStarsBackgroundCard containerClassName="border-gray-800 bg-[#191919]">
            <div className="text-center py-8 relative">
              {/* Accent corner blobs */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-xl -z-10"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-xl -z-10"></div>

              <div className="bg-gradient-to-r from-red-500/20 to-green-500/20 text-white text-sm font-medium rounded-full inline-flex px-4 py-1 mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-green-500">
                  Plan completo
                </span>
              </div>
              <div className="flex items-center justify-center mb-3">
                <span className="text-5xl font-bold text-white">$20</span>
                <span className="text-gray-400 ml-2">/mes</span>
              </div>
              <p className="text-gray-400 mb-6 text-sm">
                Facturado mensualmente o $200/año (ahorra $40)
              </p>

              <ShimmerButton
                className="w-full mb-8"
                shimmerColor="#ef4444"
                background="rgba(239, 68, 68, 0.9)"
              >
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium"
                >
                  Empezar Ahora
                  <ArrowRight
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                    size={18}
                  />
                </Link>
              </ShimmerButton>

              <div className="space-y-3 text-left">
                {features.map((feature, index) => (
                  <div key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className={`h-5 w-5 ${index % 2 === 0 ? "text-red-500" : "text-green-500"} mt-0.5`}
                      />
                    </div>
                    <span className="ml-3 text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Green accent line at the bottom */}
              <div className="mt-8 h-1 w-16 mx-auto bg-gradient-to-r from-red-500 to-green-500 rounded-full"></div>
            </div>
          </GlowingStarsBackgroundCard>
        </div>
      </div>
    </section>
  );
}

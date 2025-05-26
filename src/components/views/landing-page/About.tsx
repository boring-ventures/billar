import { CheckIcon } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";

export default function About() {
  const benefits = [
    "Desarrollado específicamente para propietarios de salones de billar",
    "Gestión integral de todos los aspectos de tu negocio",
    "Creado por expertos con años de experiencia en salones de billar",
    "Actualizaciones regulares con nuevas funciones basadas en feedback",
    "Sistema basado en la nube accesible desde cualquier lugar",
  ];

  return (
    <section id="about" className="py-24 bg-[#121212] overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <BlurFade>
            <div className="relative">
              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <div className="aspect-[4/3] relative bg-gray-800 flex items-center justify-center">
                  <div className="absolute w-full h-full flex items-center justify-center">
                    <div className="w-3/4 h-3/4 bg-gradient-to-br from-red-500/20 to-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        BILLARPRO
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-6 -right-6 bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 max-w-[240px]">
                <div className="text-2xl font-bold text-red-500 mb-1">100%</div>
                <div className="text-sm text-gray-400">
                  Diseñado para propietarios de salones de billar
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
                  ¿Por qué Elegir Nuestra App de Gestión de Billar?
                </h2>
                <p className="text-lg text-gray-400 mb-6">
                  Hemos creado la solución más intuitiva orientada a
                  dispositivos móviles que aborda los desafíos únicos que
                  enfrentan los propietarios de salones de billar. Desde la
                  gestión de mesas hasta informes financieros, nuestra
                  plataforma agiliza todos los aspectos de tu negocio.
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
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-6">
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-300 italic">
                    &ldquo;Como propietario de un salón de billar, necesitaba un
                    sistema que pudiera crecer con mi negocio. Esta aplicación
                    hace exactamente eso, mientras es increíblemente fácil de
                    usar y asequible.&rdquo;
                  </p>
                  <div className="mt-3 text-sm text-gray-500 font-medium">
                    &mdash; Daniel R., Propietario de Premier Billiards
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

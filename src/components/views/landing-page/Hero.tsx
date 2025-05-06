import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

export default function Hero() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden bg-white">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-white to-white -z-10" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-8 text-center">
              <BlurFade>
                <div className="inline-flex items-center rounded-full bg-primary/5 border border-primary/10 px-4 py-1.5 mb-4 shadow-sm">
                  <Trophy className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium text-primary">
                    Modern Pool Game Management
                  </span>
                </div>
              </BlurFade>

              <BlurFade delay={0.1}>
                <AnimatedShinyText>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                    Take your pool games to
                    <span className="block text-primary mt-2">
                      the next level
                    </span>
                  </h1>
                </AnimatedShinyText>
              </BlurFade>

              <BlurFade delay={0.2}>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mt-6">
                  Organize tournaments, track scores, and connect with other
                  pool enthusiasts with our modern platform.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                  <ShimmerButton>
                    <Link
                      href="/sign-up"
                      className="inline-flex items-center px-8 py-3 text-lg font-medium"
                    >
                      Get Started
                      <ArrowRight
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                        size={20}
                      />
                    </Link>
                  </ShimmerButton>

                  <Link
                    href="/#features"
                    className="inline-flex items-center text-gray-600 hover:text-primary transition-colors px-8 py-3"
                  >
                    Learn More
                  </Link>
                </div>
              </BlurFade>
            </div>

            {/* Stats section with enhanced styling */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-4xl mx-auto">
              {[
                { label: "Active Players", value: "5,000+" },
                { label: "Games Tracked", value: "50,000+" },
                { label: "User Satisfaction", value: "4.8/5" },
              ].map((stat, i) => (
                <BlurFade
                  key={stat.label}
                  delay={i * 0.1 + 0.3}
                  className="flex flex-col items-center p-6 hover:transform hover:scale-105 transition-all duration-300"
                >
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white"></div>
    </section>
  );
}

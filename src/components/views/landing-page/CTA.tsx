import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

export default function CTA() {
  return (
    <section className="py-28 bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100 -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-20 -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto backdrop-blur-sm bg-white/30 rounded-2xl p-12 border border-white/40 shadow-xl">
          <div className="text-center">
            <BlurFade>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <Trophy className="h-8 w-8 text-primary" />
              </div>

              <AnimatedShinyText>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Ready to elevate your pool game?
                </h2>
              </AnimatedShinyText>

              <p className="text-xl text-gray-600 mb-10">
                Join Billar today and take your pool games management to a new
                level.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
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
                  href="#features"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Explore Features
                </Link>
              </div>
            </BlurFade>
          </div>
        </div>
      </div>
    </section>
  );
}

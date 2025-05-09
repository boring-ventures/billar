"use client";

import Link from "next/link";
import { ArrowRight, Gauge } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MotionSection, MotionStagger } from "@/components/magicui/motion-section";

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  
  // Subtle parallax effect on scroll
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background image with overlay and parallax effect */}
      <motion.div 
        className="absolute inset-0 -z-10"
        style={{ y, opacity }}
      >
        <Image 
          src="/images/modern-billar-hall.jpg" 
          alt="Modern billar hall"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white/90"></div>
      </motion.div>

      {/* Subtle gradient accents */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 max-w-7xl mx-auto">
          {/* Hero content with sequential fade-in */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <MotionSection delay={0.1} duration={0.7}>
              <div className="inline-flex items-center rounded-full bg-primary/5 border border-primary/10 px-4 py-1.5 mb-4 shadow-sm">
                <Gauge className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">
                  Transform Your Billar Hall Operations
                </span>
              </div>
            </MotionSection>

            <MotionSection delay={0.3} duration={0.7}>
              <AnimatedShinyText>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                  Take Control of Your
                  <span className="block text-primary mt-2">
                    Billar Business
                  </span>
                </h1>
              </AnimatedShinyText>
            </MotionSection>

            <MotionSection delay={0.5} duration={0.7}>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 mt-6">
                Simplify scheduling, payments, and reporting to focus on what matters: your players.
                Our comprehensive management platform elevates your billar hall experience.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-10">
                <ShimmerButton>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center px-8 py-3 text-lg font-medium"
                  >
                    Start Your Free Trial
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
                  Explore Features
                </Link>
              </div>
            </MotionSection>
          </div>

          {/* Hero image with float animation */}
          <div className="flex-1 relative">
            <MotionSection delay={0.7} duration={0.8}>
              <motion.div 
                className="relative w-full aspect-[4/3] shadow-2xl rounded-xl overflow-hidden border-8 border-white"
                animate={{ 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 6,
                  ease: "easeInOut" 
                }}
              >
                <Image
                  src="/images/billar-app-dashboard.jpg"
                  alt="Billar management app interface"
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
              </motion.div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
            </MotionSection>
          </div>
        </div>

        {/* Stats section with staggered animation */}
        <MotionStagger 
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto"
          delay={0.9}
          duration={0.5}
          staggerChildren={0.15}
          type="slide"
        >
          {[
            { label: "Tables Managed", value: "10,000+" },
            { label: "Hours Saved Monthly", value: "1,200+" },
            { label: "Revenue Increase", value: "25%" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="text-3xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </MotionStagger>
      </div>

      {/* Section divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white"></div>
    </section>
  );
}

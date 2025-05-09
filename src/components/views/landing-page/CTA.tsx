"use client";

import Link from "next/link";
import { ArrowRight, Trophy, Check } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { MotionSection, MotionStagger } from "@/components/magicui/motion-section";
import { motion } from "framer-motion";

export default function CTA() {
  const benefits = [
    "Streamlined table management",
    "Automated billing and payments",
    "Customer loyalty tracking",
    "Detailed business analytics",
    "Tournament organization tools",
    "Free 14-day trial, no credit card required"
  ];

  return (
    <section className="py-24 bg-gray-50/80 relative overflow-hidden">
      {/* Animated background accents */}
      <motion.div 
        className="absolute top-20 right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-0" 
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-0"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: "easeInOut",
          delay: 1
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <MotionSection type="scale" duration={0.7}>
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/10">
            <div className="flex flex-col lg:flex-row">
              {/* Left content with staggered animation */}
              <div className="p-8 md:p-12 lg:py-16 lg:px-12 lg:w-3/5 flex flex-col justify-center">
                <MotionSection delay={0.1} duration={0.6}>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Ready to Transform Your <span className="text-primary">Billar Hall</span> Operations?
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Join thousands of billar hall owners who have increased efficiency, boosted revenue, and enhanced customer satisfaction with our platform.
                  </p>
                </MotionSection>

                <MotionStagger 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-10"
                  staggerChildren={0.07}
                  delay={0.3}
                  duration={0.4}
                >
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Check className="h-5 w-5 text-accent mr-2 flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <span className="text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </MotionStagger>

                <MotionSection delay={0.6} duration={0.5}>
                  <div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ShimmerButton className="bg-accent text-white hover:bg-accent/90 border-none">
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
                    </motion.div>
                    <p className="text-sm text-gray-500 mt-4">
                      No credit card required. Full access for 14 days.
                    </p>
                  </div>
                </MotionSection>
              </div>

              {/* Right gradient/pattern with subtle animation */}
              <div className="lg:w-2/5 bg-gradient-to-br from-primary/90 to-primary/80 relative overflow-hidden hidden lg:block">
                <motion.div 
                  className="absolute inset-0 opacity-20"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 30,
                    ease: "linear"
                  }}
                  style={{ 
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="1" fill-rule="evenodd"%3E%3Ccircle cx="20" cy="20" r="3"/%3E%3C/g%3E%3C/svg%3E")', 
                    backgroundSize: '24px 24px' 
                  }}
                />
                <div className="relative p-16 flex flex-col h-full justify-center">
                  <MotionSection delay={0.4} duration={0.6}>
                    <div className="text-white space-y-6">
                      <div className="text-3xl font-bold">Join Our Community</div>
                      <p className="opacity-90">
                        Connect with other billar hall owners, share best practices, and grow your business together.
                      </p>
                      <motion.div 
                        className="bg-white/20 p-4 rounded-lg backdrop-blur-sm"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                      >
                        <blockquote className="text-white italic">
                          "The community support alone is worth the subscription. I've implemented several ideas from other owners that have significantly improved our operations."
                        </blockquote>
                        <div className="mt-2 font-medium">— Alex Martinez, 8-Ball Kings</div>
                      </motion.div>
                    </div>
                  </MotionSection>
                </div>
              </div>
            </div>
          </div>
        </MotionSection>
      </div>
    </section>
  );
}

"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { MotionSection, MotionStagger } from "@/components/magicui/motion-section";
import { motion } from "framer-motion";

export default function About() {
  const challenges = [
    "Manual table bookings leading to scheduling conflicts",
    "Cash handling errors and revenue leakage",
    "Difficulty tracking customer preferences and loyalty",
    "Time-consuming paperwork for reporting and analysis",
    "Limited visibility into business performance metrics",
  ];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side: Problem/Solution with animations */}
          <div className="space-y-8">
            <MotionSection type="slide" duration={0.6}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  The Smarter Way to Manage Your Billar Hall
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Running a billar hall involves juggling many responsibilities simultaneously. 
                  Our platform eliminates the common pain points that prevent you from focusing 
                  on what matters most - providing an exceptional experience for your players.
                </p>
              </div>
            </MotionSection>

            <MotionSection delay={0.2} type="slide" duration={0.6}>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Common Challenges We Solve:</h3>
                <ul className="space-y-3">
                  {challenges.map((challenge, index) => (
                    <motion.li 
                      key={challenge} 
                      className="flex items-start"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.4 + (index * 0.1),
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                    >
                      <CheckCircle2 className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{challenge}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </MotionSection>

            <MotionSection delay={0.6} type="slide" duration={0.6}>
              <div className="pt-2">
                <a
                  href="/sign-up"
                  className="inline-flex items-center text-primary font-medium hover:text-primary/90 transition-colors"
                >
                  See how our solution works
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </MotionSection>
          </div>

          {/* Right side: Visual representation with animations */}
          <div className="relative">
            {/* Design elements with subtle animations */}
            <motion.div 
              className="absolute -z-10 -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 8,
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute -z-10 bottom-20 right-20 w-20 h-20 bg-primary/10 rounded-full"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 6,
                ease: "easeInOut",
                delay: 1
              }}
            />

            <MotionSection delay={0.3} type="scale" duration={0.7}>
              <div className="relative rounded-2xl overflow-hidden shadow-xl border-8 border-white">
                <div className="aspect-[4/3]">
                  <Image
                    src="/images/billar-solution-diagram.jpg"
                    alt="Billar management solution diagram"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              {/* Process steps with staggered animation */}
              <motion.div 
                className="absolute -bottom-8 -right-8 bg-white rounded-xl p-6 shadow-lg border border-gray-100 max-w-xs"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <h4 className="font-semibold text-gray-900 mb-3">Simple 3-Step Process:</h4>
                <ol className="space-y-2">
                  {[
                    "Register your tables and equipment",
                    "Configure pricing and availability",
                    "Start managing reservations instantly"
                  ].map((step, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.7 + (index * 0.15),
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                    >
                      <span className="flex items-center justify-center bg-primary/10 text-primary font-medium rounded-full w-6 h-6 mr-3 text-sm">{index + 1}</span>
                      <span className="text-sm text-gray-600">{step}</span>
                    </motion.li>
                  ))}
                </ol>
              </motion.div>
            </MotionSection>
          </div>
        </div>
      </div>
    </section>
  );
}

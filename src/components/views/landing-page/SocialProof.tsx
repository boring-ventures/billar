"use client";

import { MotionSection, MotionStagger } from "@/components/magicui/motion-section";
import { motion } from "framer-motion";

export default function SocialProof() {
  const partners = [
    "/logos/partner1.svg",
    "/logos/partner2.svg", 
    "/logos/partner3.svg",
    "/logos/partner4.svg",
    "/logos/partner5.svg",
    "/logos/partner6.svg",
  ];

  return (
    <section className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4">
        <MotionSection delay={0.2} type="fade" duration={0.7}>
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm font-medium">
              TRUSTED BY LEADING BILLAR BUSINESSES WORLDWIDE
            </p>
          </div>
        </MotionSection>

        <MotionStagger 
          className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8"
          staggerChildren={0.1}
          delay={0.3}
          duration={0.5}
        >
          {partners.map((logo, index) => (
            <motion.div 
              key={index} 
              className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition duration-300"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="h-10 w-32 bg-gray-300 rounded animate-pulse"></div>
            </motion.div>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

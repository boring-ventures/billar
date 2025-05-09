"use client";

import { Quote } from "lucide-react";
import Image from "next/image";
import { MotionSection, MotionStagger } from "@/components/magicui/motion-section";
import { motion } from "framer-motion";

export default function Testimonials() {
  const testimonials = [
    {
      id: "1",
      quote:
        "After implementing Billar, our scheduling conflicts disappeared completely. Revenue is up 20% and our staff can focus on providing better service instead of paperwork.",
      name: "Michael Rodriguez",
      title: "Owner, Elite Billar Club",
      image: "/images/testimonial-1.jpg",
    },
    {
      id: "2",
      quote:
        "The customer insights alone are worth the investment. We've increased our repeat customers by 35% by understanding player preferences and peak times.",
      name: "Sarah Johnson",
      title: "Manager, Downtown Billiards",
      image: "/images/testimonial-2.jpg",
    },
    {
      id: "3",
      quote:
        "The tournament management feature has completely transformed our business. We now host weekly events that bring in new players and increase our weekday revenue.",
      name: "David Chen",
      title: "Owner, Champions Pool Hall",
      image: "/images/testimonial-3.jpg",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <MotionSection type="slide" duration={0.7}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Billar Hall Owners
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it. Here's what our customers say about their experience.
            </p>
          </div>
        </MotionSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <MotionSection 
              key={testimonial.id} 
              delay={0.2 + (index * 0.15)}
              type="scale"
              duration={0.6}
            >
              <motion.div 
                className="h-full bg-gray-50 border border-gray-100 rounded-2xl p-8 flex flex-col"
                whileHover={{ 
                  y: -5, 
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" 
                }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.3 + (index * 0.15), 
                    duration: 0.4,
                    type: "spring"
                  }}
                >
                  <Quote className="h-8 w-8 text-primary/30" />
                </motion.div>
                
                <div className="flex-grow">
                  <p className="text-gray-700 italic mb-8">"{testimonial.quote}"</p>
                </div>
                
                <motion.div 
                  className="flex items-center mt-auto"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.5 + (index * 0.15), 
                    duration: 0.5 
                  }}
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-white shadow-sm">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </motion.div>
              </motion.div>
            </MotionSection>
          ))}
        </div>

        {/* Trust badges with staggered animation */}
        <MotionSection delay={0.5} type="fade" duration={0.8}>
          <div className="mt-20 pt-10 border-t border-gray-100">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-900">Trusted by Industry Leaders</h3>
            </div>
            
            <MotionStagger 
              className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
              staggerChildren={0.15}
              delay={0.6}
              duration={0.4}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                  <motion.div 
                    className="h-10 w-32 bg-gray-200 rounded animate-pulse"
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                  ></motion.div>
                </div>
              ))}
            </MotionStagger>
          </div>
        </MotionSection>
      </div>
    </section>
  );
}

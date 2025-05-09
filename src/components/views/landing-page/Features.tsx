"use client";

import { CalendarDays, BarChart, CreditCard, Users, Table, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MotionSection, MotionStagger } from "@/components/magicui/motion-section";
import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      icon: <Table className="h-10 w-10 text-blue-700" />,
      title: "Table Management",
      description:
        "Track table availability, usage patterns, and maintenance schedules. Optimize your table rotation for maximum revenue.",
    },
    {
      icon: <CalendarDays className="h-10 w-10 text-blue-700" />,
      title: "Reservations & Scheduling",
      description:
        "Let players book tables in advance through a user-friendly interface. Reduce no-shows with automated reminders.",
    },
    {
      icon: <CreditCard className="h-10 w-10 text-blue-700" />,
      title: "Payment Processing",
      description:
        "Handle payments seamlessly with integrated billing. Track revenue by table, time period, or customer segment.",
    },
    {
      icon: <Users className="h-10 w-10 text-blue-700" />,
      title: "Customer Management",
      description:
        "Build a database of regular players, track preferences, and implement loyalty programs to increase retention.",
    },
    {
      icon: <BarChart className="h-10 w-10 text-blue-700" />,
      title: "Analytics & Reporting",
      description:
        "Gain insights with comprehensive reports on usage trends, peak hours, and revenue metrics to optimize your operations.",
    },
    {
      icon: <ClipboardList className="h-10 w-10 text-blue-700" />,
      title: "Tournament Organization",
      description:
        "Plan and manage tournaments with automated brackets, player registration, and real-time score updates.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Background elements with subtle animation */}
      <motion.div 
        className="absolute top-40 right-0 w-96 h-96 bg-blue-700/5 rounded-full blur-3xl opacity-70"
        animate={{ 
          x: [50, 0, 50],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 15,
          ease: "easeInOut" 
        }}
      />
      <motion.div 
        className="absolute bottom-40 left-0 w-80 h-80 bg-blue-700/5 rounded-full blur-3xl opacity-70"
        animate={{ 
          x: [-30, 0, -30],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 12,
          ease: "easeInOut",
          delay: 2
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <MotionSection type="slide" duration={0.7}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to <span className="text-blue-700">Run Your Billar Hall</span>
            </h2>
            <p className="text-xl text-gray-600">
              Our comprehensive suite of tools helps you streamline operations,
              increase revenue, and <span className="text-blue-700 font-medium">enhance player satisfaction</span>.
            </p>
          </div>
        </MotionSection>

        <MotionStagger 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          staggerChildren={0.1}
          delay={0.3}
          duration={0.5}
        >
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="relative h-full overflow-hidden bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow group"
            >
              <motion.div 
                className="absolute top-0 right-0 w-32 h-32 bg-blue-700/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-700/10 transition-colors"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 5 + index,
                  ease: "easeInOut",
                }}
              />
              
              <div className="relative">
                <motion.div 
                  className="bg-blue-700/10 p-3 rounded-xl inline-flex mb-5 group-hover:bg-blue-700/20 transition-colors"
                  whileHover={{ 
                    rotate: 5,
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                >
                  {feature.icon}
                </motion.div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </MotionStagger>

        <MotionSection delay={0.6} type="scale" duration={0.7}>
          <div className="mt-16 bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-sm max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  How It Works
                </h3>
                <p className="text-gray-600">
                  Our platform seamlessly integrates into your existing operation with minimal setup time. Simply register your tables, customize your settings, and start managing your billar hall more efficiently.
                </p>
              </div>
              <motion.div 
                className="flex items-center gap-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <motion.a 
                  href="#" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-700 text-white h-10 px-4 py-2 hover:bg-blue-700/90 transition-colors"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 1 }}
                >
                  Watch Demo
                </motion.a>
                <motion.a 
                  href="#" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-white h-10 px-4 py-2 hover:bg-gray-50 transition-colors"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 1 }}
                >
                  Learn More
                </motion.a>
              </motion.div>
            </div>
          </div>
        </MotionSection>
      </div>
    </section>
  );
}

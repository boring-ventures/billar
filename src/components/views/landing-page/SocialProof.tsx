"use client";

import React from "react";
import { BlurFade } from "@/components/magicui/blur-fade";

export default function SocialProof() {
  // Logos for business types that might use this SaaS
  const logos = [
    { name: "Billiard Hub", logo: "/logos/logo1.svg" },
    { name: "Cue Masters", logo: "/logos/logo2.svg" },
    { name: "Pool Paradise", logo: "/logos/logo3.svg" },
    { name: "Chalk & Cue", logo: "/logos/logo4.svg" },
    { name: "8-Ball Lounge", logo: "/logos/logo5.svg" },
    { name: "Strike & Pocket", logo: "/logos/logo6.svg" },
  ];

  // Stats showing the platform's impact
  const stats = [
    { value: "250+", label: "Billiard Venues" },
    { value: "15,000+", label: "Tables Managed" },
    { value: "$2.5M+", label: "Revenue Processed" },
    { value: "98%", label: "Customer Retention" },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-primary font-medium">
            Trusted by billiard parlours worldwide
          </p>
        </div>

        {/* Logos */}
        <div className="relative">
          <BlurFade>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 mb-16">
              {logos.map((logo) => (
                <div
                  key={logo.name}
                  className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                >
                  {/* Logo placeholder - replace with actual logos */}
                  <div className="h-8 flex items-center justify-center text-slate-400 dark:text-slate-600 font-semibold">
                    {logo.name}
                  </div>
                </div>
              ))}
            </div>
          </BlurFade>
        </div>

        {/* Stats */}
        <div className="border-t border-b border-slate-200 dark:border-slate-800 py-12 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <BlurFade key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Integrates with your favorite tools
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            {[
              "Stripe",
              "PayPal",
              "Square",
              "Google Calendar",
              "Mailchimp",
              "Twilio",
            ].map((tool) => (
              <span
                key={tool}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full text-sm text-slate-600 dark:text-slate-400"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

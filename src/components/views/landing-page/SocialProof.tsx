"use client";

import React from "react";
import { Trophy, Target, Award, Star, Users, Bookmark } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";

const partners = [
  { name: "Pro League", icon: Trophy },
  { name: "Eight Ball Association", icon: Target },
  { name: "National Pool Tours", icon: Award },
  { name: "Champions Club", icon: Star },
  { name: "Pool Players Network", icon: Users },
  { name: "Premium Tables", icon: Bookmark },
];

export default function SocialProof() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <BlurFade>
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wider">
              Trusted by organizations worldwide
            </p>
          </div>
        </BlurFade>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          {partners.map((partner, i) => (
            <BlurFade key={partner.name} delay={i * 0.1}>
              <div className="flex flex-col items-center justify-center group">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <partner.icon className="h-8 w-8 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {partner.name}
                </span>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

interface GlowingStarsBackgroundCardProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  starCount?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
}

export function GlowingStarsBackgroundCard({
  children,
  className,
  containerClassName,
  starCount = 40,
  minSize = 1,
  maxSize = 3,
  speed = 0.5,
}: GlowingStarsBackgroundCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<
    Array<{
      id: number;
      size: number;
      x: number;
      y: number;
      duration: number;
      delay: number;
    }>
  >([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create initial stars
    const newStars = Array.from({ length: starCount }, (_, i) => ({
      id: i,
      size: Math.random() * (maxSize - minSize) + minSize,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: (Math.random() * 5 + 3) / speed,
      delay: Math.random() * 2,
    }));

    setStars(newStars);

    // Recreate stars periodically to ensure continuous animation
    const interval = setInterval(() => {
      setStars((prevStars) =>
        prevStars.map((star) => ({
          ...star,
          x: Math.random() * 100,
          y: Math.random() * 100,
          duration: (Math.random() * 5 + 3) / speed,
          delay: Math.random() * 2,
        }))
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [starCount, minSize, maxSize, speed]);

  return (
    <div
      className={cn(
        "relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden",
        containerClassName
      )}
      ref={containerRef}
    >
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-primary/40 animate-pulse"
            style={{
              top: `${star.y}%`,
              left: `${star.x}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Glow effects */}
      <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary/20 blur-[80px]" />
      <div className="absolute -right-20 -bottom-20 h-[300px] w-[300px] rounded-full bg-indigo-500/20 blur-[80px]" />

      {/* Content with glass effect */}
      <div
        className={cn(
          "relative z-10 bg-white/5 backdrop-blur-sm p-8 rounded-3xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

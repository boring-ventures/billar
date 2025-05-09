"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type MotionSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  yOffset?: number;
  opacity?: [number, number];
  type?: "fade" | "slide" | "scale" | "none";
};

export function MotionSection({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  once = true,
  yOffset = 30,
  opacity = [0, 1],
  type = "fade",
}: MotionSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-10% 0px -10% 0px" });

  const variants = {
    hidden: {
      opacity: opacity[0],
      y: type === "slide" ? yOffset : 0,
      scale: type === "scale" ? 0.95 : 1,
    },
    visible: {
      opacity: opacity[1],
      y: 0,
      scale: 1,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // Smooth "ease-out" curve
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

export function MotionStagger({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  once = true,
  staggerChildren = 0.1,
  yOffset = 30,
  type = "fade",
}: MotionSectionProps & { staggerChildren?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-10% 0px -10% 0px" });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: type === "slide" ? yOffset : 0,
      scale: type === "scale" ? 0.95 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1], // Smooth "ease-out" curve
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
} 
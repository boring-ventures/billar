"use client"

import type React from "react"
import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

interface ParallaxSectionProps {
  children: React.ReactNode
  className?: string
  speed?: number
  direction?: "up" | "down" | "left" | "right"
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  className = "",
  speed = 0.2,
  direction = "up",
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  // Create a smoother scroll progress
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // Transform based on direction
  const range = 100 * speed // pixels to move
  let translateX = useTransform(smoothProgress, [0, 1], [`translateX(0px)`, `translateX(0px)`])
  let translateY = useTransform(smoothProgress, [0, 1], [`translateY(0px)`, `translateY(0px)`])

  switch (direction) {
    case "up":
      translateY = useTransform(smoothProgress, [0, 1], [`translateY(${range}px)`, `translateY(-${range}px)`])
      break
    case "down":
      translateY = useTransform(smoothProgress, [0, 1], [`translateY(-${range}px)`, `translateY(${range}px)`])
      break
    case "left":
      translateX = useTransform(smoothProgress, [0, 1], [`translateX(${range}px)`, `translateX(-${range}px)`])
      break
    case "right":
      translateX = useTransform(smoothProgress, [0, 1], [`translateX(-${range}px)`, `translateX(${range}px)`])
      break
    default:
      translateY = useTransform(smoothProgress, [0, 1], [`translateY(${range}px)`, `translateY(-${range}px)`])
  }

  const transform = direction === "left" || direction === "right" ? translateX : translateY

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ transform }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  )
}

export default ParallaxSection

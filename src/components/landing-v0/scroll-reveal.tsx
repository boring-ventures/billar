"use client"

import type React from "react"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
  once?: boolean
  threshold?: number
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  direction = "up",
  distance = 50,
  once = true,
  threshold = 0.1,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, amount: threshold })

  // Set initial and animate values based on direction
  const getInitialAndAnimate = () => {
    const initial = { opacity: 0 }

    switch (direction) {
      case "up":
        initial.y = distance
        break
      case "down":
        initial.y = -distance
        break
      case "left":
        initial.x = distance
        break
      case "right":
        initial.x = -distance
        break
      case "none":
        // No movement, just opacity
        break
    }

    return {
      initial,
      animate: {
        opacity: isInView ? 1 : 0,
        x: isInView ? 0 : initial.x,
        y: isInView ? 0 : initial.y,
      },
    }
  }

  const { initial, animate } = getInitialAndAnimate()

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={animate}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  )
}

export default ScrollReveal

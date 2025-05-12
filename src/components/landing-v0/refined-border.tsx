"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { motion, useAnimation, useInView, useMotionValue, useTransform } from "framer-motion"

interface RefinedBorderProps {
  children: React.ReactNode
  color: "red" | "green"
  className?: string
  thickness?: number
  hoverEffect?: boolean
  glowIntensity?: number
}

export const RefinedBorder: React.FC<RefinedBorderProps> = ({
  children,
  color,
  className = "",
  thickness = 2,
  hoverEffect = true,
  glowIntensity = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })
  const controls = useAnimation()
  const [isHovered, setIsHovered] = useState(false)

  // Define colors based on the prop
  const borderColor = color === "red" ? "#ef4444" : "#10b981"
  const glowColor = color === "red" ? "rgba(239, 68, 68, 0.5)" : "rgba(16, 185, 129, 0.5)"

  // Animation for the border
  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  // Hover animation values
  const hoverIntensity = useMotionValue(0)
  const glowOpacity = useTransform(hoverIntensity, [0, 1], [glowIntensity, glowIntensity * 2])
  const glowSize = useTransform(hoverIntensity, [0, 1], [8, 12])

  useEffect(() => {
    if (hoverEffect) {
      hoverIntensity.set(isHovered ? 1 : 0)
    }
  }, [isHovered, hoverEffect, hoverIntensity])

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, scale: 0.98 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            duration: 0.5,
            ease: "easeOut",
          },
        },
      }}
    >
      {/* Border container */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          boxShadow: `0 0 ${glowSize.get()}px ${glowColor}`,
        }}
        animate={{
          boxShadow: `0 0 ${glowSize.get()}px ${glowColor}`,
        }}
      >
        {/* Top border */}
        <motion.div
          className="absolute top-0 left-0 right-0 origin-left"
          style={{
            height: thickness,
            backgroundColor: borderColor,
          }}
          variants={{
            hidden: { scaleX: 0 },
            visible: {
              scaleX: 1,
              transition: {
                delay: 0.1,
                duration: 0.6,
                ease: "easeInOut",
              },
            },
          }}
        />

        {/* Right border */}
        <motion.div
          className="absolute top-0 right-0 bottom-0 origin-top"
          style={{
            width: thickness,
            backgroundColor: borderColor,
          }}
          variants={{
            hidden: { scaleY: 0 },
            visible: {
              scaleY: 1,
              transition: {
                delay: 0.4,
                duration: 0.6,
                ease: "easeInOut",
              },
            },
          }}
        />

        {/* Bottom border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 origin-right"
          style={{
            height: thickness,
            backgroundColor: borderColor,
          }}
          variants={{
            hidden: { scaleX: 0 },
            visible: {
              scaleX: 1,
              transition: {
                delay: 0.7,
                duration: 0.6,
                ease: "easeInOut",
              },
            },
          }}
        />

        {/* Left border */}
        <motion.div
          className="absolute top-0 left-0 bottom-0 origin-bottom"
          style={{
            width: thickness,
            backgroundColor: borderColor,
          }}
          variants={{
            hidden: { scaleY: 0 },
            visible: {
              scaleY: 1,
              transition: {
                delay: 1.0,
                duration: 0.6,
                ease: "easeInOut",
              },
            },
          }}
        />

        {/* Corner accents */}
        <motion.div
          className="absolute top-0 left-0 w-3 h-3 rounded-tl-xl"
          style={{ backgroundColor: borderColor }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                delay: 1.3,
                duration: 0.3,
              },
            },
          }}
        />
        <motion.div
          className="absolute top-0 right-0 w-3 h-3 rounded-tr-xl"
          style={{ backgroundColor: borderColor }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                delay: 1.3,
                duration: 0.3,
              },
            },
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-3 h-3 rounded-br-xl"
          style={{ backgroundColor: borderColor }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                delay: 1.3,
                duration: 0.3,
              },
            },
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-3 h-3 rounded-bl-xl"
          style={{ backgroundColor: borderColor }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                delay: 1.3,
                duration: 0.3,
              },
            },
          }}
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 rounded-xl overflow-hidden"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              delay: 0.2,
              duration: 0.5,
            },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export default RefinedBorder

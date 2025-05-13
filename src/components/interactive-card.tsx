"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"

interface InteractiveCardProps {
  children: React.ReactNode
  className?: string
  intensity?: number
  color?: "red" | "green"
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  className = "",
  intensity = 15,
  color = "green",
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0, left: 0, top: 0 })

  // Define colors based on the prop
  const borderColor = color === "red" ? "#ef4444" : "#10b981"
  const glowColor = color === "red" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"

  // Update card dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (cardRef.current) {
        const { width, height, left, top } = cardRef.current.getBoundingClientRect()
        setCardDimensions({ width, height, left, top })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const { clientX, clientY } = e
      const { left, top } = cardDimensions
      setMousePosition({
        x: clientX - left,
        y: clientY - top,
      })
    }
  }

  // Calculate rotation based on mouse position
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  useEffect(() => {
    if (isHovered) {
      const { width, height } = cardDimensions
      const { x, y } = mousePosition

      // Calculate rotation (inverted for natural feel)
      const newRotateY = ((x - width / 2) / width) * intensity
      const newRotateX = -((y - height / 2) / height) * intensity

      rotateX.set(newRotateX)
      rotateY.set(newRotateY)
    } else {
      // Reset rotation when not hovered
      rotateX.set(0)
      rotateY.set(0)
    }
  }, [isHovered, mousePosition, cardDimensions, intensity, rotateX, rotateY])

  // Smooth out the rotation values
  const smoothRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
  const smoothRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })

  // Calculate highlight position
  const highlightX = useTransform(
    smoothRotateY,
    [-intensity, intensity],
    [cardDimensions.width * 0.75, cardDimensions.width * 0.25],
  )
  const highlightY = useTransform(
    smoothRotateX,
    [-intensity, intensity],
    [cardDimensions.height * 0.75, cardDimensions.height * 0.25],
  )

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative w-full h-full rounded-xl overflow-hidden"
        style={{
          rotateX: smoothRotateX,
          rotateY: smoothRotateY,
          transformStyle: "preserve-3d",
          boxShadow: isHovered ? `0 10px 30px -5px ${glowColor}, 0 0 5px ${glowColor}` : "none",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {/* Highlight effect */}
        {isHovered && (
          <motion.div
            className="absolute pointer-events-none z-10"
            style={{
              width: cardDimensions.width * 0.5,
              height: cardDimensions.height * 0.5,
              borderRadius: "100%",
              background: `radial-gradient(circle at center, ${borderColor}20, transparent 70%)`,
              left: highlightX,
              top: highlightY,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {/* Border effect */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            border: `1px solid ${borderColor}${isHovered ? "40" : "20"}`,
            opacity: isHovered ? 1 : 0.5,
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Content */}
        <div className="relative z-0">{children}</div>
      </motion.div>
    </motion.div>
  )
}

export default InteractiveCard

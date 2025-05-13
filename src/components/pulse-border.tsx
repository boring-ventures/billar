"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface PulseBorderProps {
  children: React.ReactNode
  color: "red" | "green"
  className?: string
  pulseIntensity?: number
  pulseSpeed?: number
}

export const PulseBorder: React.FC<PulseBorderProps> = ({
  children,
  color,
  className = "",
  pulseIntensity = 0.5,
  pulseSpeed = 1,
}) => {
  const [opacity, setOpacity] = useState(0.2)

  // Define colors based on the prop
  const borderColor = color === "red" ? "#ef4444" : "#10b981"

  useEffect(() => {
    let direction = 1
    let currentOpacity = opacity

    const interval = setInterval(() => {
      currentOpacity += 0.01 * direction * pulseSpeed

      if (currentOpacity >= 0.2 + pulseIntensity) {
        direction = -1
      } else if (currentOpacity <= 0.2) {
        direction = 1
      }

      setOpacity(currentOpacity)
    }, 50)

    return () => clearInterval(interval)
  }, [pulseIntensity, pulseSpeed])

  return (
    <div
      className={`relative rounded-xl ${className}`}
      style={{
        boxShadow: `0 0 0 2px ${borderColor}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0")}, 0 0 ${8 + opacity * 10}px ${borderColor}${Math.round(opacity * 100)
          .toString(16)
          .padStart(2, "0")}`,
      }}
    >
      {children}
    </div>
  )
}

export default PulseBorder

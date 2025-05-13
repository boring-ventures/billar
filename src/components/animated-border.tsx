"use client"

import type React from "react"
import { useEffect, useRef } from "react"

interface AnimatedBorderProps {
  children: React.ReactNode
  color: "red" | "green"
  className?: string
  thickness?: number
  speed?: number
}

export const AnimatedBorder: React.FC<AnimatedBorderProps> = ({
  children,
  color,
  className = "",
  thickness = 2,
  speed = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Define colors based on the prop
  const borderColor = color === "red" ? "#ef4444" : "#10b981"
  const glowColor = color === "red" ? "rgba(239, 68, 68, 0.5)" : "rgba(16, 185, 129, 0.5)"

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Animation variables
    let animationId: number
    let offset = 0

    // Draw the animated border
    const drawBorder = () => {
      const width = canvas.width
      const height = canvas.height

      // Clear the canvas
      ctx.clearRect(0, 0, width, height)

      // Set line properties
      ctx.lineWidth = thickness
      ctx.strokeStyle = borderColor
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 8

      // Calculate the animation offset
      offset = (offset + 0.005 * speed) % 1

      // Draw the border with animated dash pattern
      ctx.beginPath()

      // Top line
      const topStart = width * offset
      ctx.moveTo(topStart, 0)
      ctx.lineTo(width, 0)
      ctx.moveTo(0, 0)
      ctx.lineTo(topStart, 0)

      // Right line
      const rightStart = height * offset
      ctx.moveTo(width, rightStart)
      ctx.lineTo(width, height)
      ctx.moveTo(width, 0)
      ctx.lineTo(width, rightStart)

      // Bottom line
      const bottomStart = width * (1 - offset)
      ctx.moveTo(bottomStart, height)
      ctx.lineTo(0, height)
      ctx.moveTo(width, height)
      ctx.lineTo(bottomStart, height)

      // Left line
      const leftStart = height * (1 - offset)
      ctx.moveTo(0, leftStart)
      ctx.lineTo(0, 0)
      ctx.moveTo(0, height)
      ctx.lineTo(0, leftStart)

      ctx.stroke()

      // Request next frame
      animationId = requestAnimationFrame(drawBorder)
    }

    // Start animation
    drawBorder()

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [color, thickness, speed, borderColor, glowColor])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ filter: `drop-shadow(0 0 2px ${glowColor})` }}
      />
      <div className="relative z-0">{children}</div>
    </div>
  )
}

export default AnimatedBorder

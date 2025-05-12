"use client"

import type React from "react"
import { useRef, useEffect } from "react"

interface AnimatedGradientProps {
  className?: string
  colors?: string[]
  speed?: number
  opacity?: number
}

export const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  className = "",
  colors = ["#ef4444", "#10b981", "#3b82f6", "#8b5cf6"],
  speed = 1,
  opacity = 0.1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create gradient points
    const points: {
      x: number
      y: number
      radius: number
      color: string
      vx: number
      vy: number
    }[] = []

    // Initialize points
    const createPoints = () => {
      const pointCount = 8
      points.length = 0

      for (let i = 0; i < pointCount; i++) {
        points.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 100 + Math.random() * 200,
          color: colors[i % colors.length],
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
        })
      }
    }

    createPoints()

    // Animation loop
    const animate = () => {
      // Clear canvas with a semi-transparent black
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - opacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw points
      for (const point of points) {
        // Move point
        point.x += point.vx
        point.y += point.vy

        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1

        // Draw gradient
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.radius)
        gradient.addColorStop(
          0,
          `${point.color}${Math.round(opacity * 255)
            .toString(16)
            .padStart(2, "0")}`,
        )
        gradient.addColorStop(1, "transparent")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [colors, speed, opacity])

  return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none z-0 ${className}`} />
}

export default AnimatedGradient

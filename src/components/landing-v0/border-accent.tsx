"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface BorderAccentProps {
  position: "top-right" | "bottom-left" | "top-left" | "bottom-right"
  className?: string
}

export const BorderAccent: React.FC<BorderAccentProps> = ({ position, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 200
    canvas.height = 200

    // Draw the accent lines
    const drawAccent = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set line properties
      ctx.lineWidth = 1
      ctx.strokeStyle = "#10B981" // Green color

      // Draw multiple lines with varying opacity
      const lineCount = 5
      const spacing = 10

      for (let i = 0; i < lineCount; i++) {
        const alpha = 0.2 + i * 0.1
        ctx.globalAlpha = alpha

        if (position === "top-right") {
          // Lines extending from top right
          ctx.beginPath()
          ctx.moveTo(canvas.width - i * spacing, 0)
          ctx.lineTo(canvas.width, i * spacing)
          ctx.stroke()

          // Additional line
          ctx.beginPath()
          ctx.moveTo(canvas.width - 50 - i * spacing, 0)
          ctx.lineTo(canvas.width, 50 + i * spacing)
          ctx.stroke()
        } else if (position === "bottom-left") {
          // Lines extending from bottom left
          ctx.beginPath()
          ctx.moveTo(0, canvas.height - i * spacing)
          ctx.lineTo(i * spacing, canvas.height)
          ctx.stroke()

          // Additional line
          ctx.beginPath()
          ctx.moveTo(0, canvas.height - 50 - i * spacing)
          ctx.lineTo(50 + i * spacing, canvas.height)
          ctx.stroke()
        } else if (position === "top-left") {
          // Lines extending from top left
          ctx.beginPath()
          ctx.moveTo(0, i * spacing)
          ctx.lineTo(i * spacing, 0)
          ctx.stroke()

          // Additional line
          ctx.beginPath()
          ctx.moveTo(0, 50 + i * spacing)
          ctx.lineTo(50 + i * spacing, 0)
          ctx.stroke()
        } else if (position === "bottom-right") {
          // Lines extending from bottom right
          ctx.beginPath()
          ctx.moveTo(canvas.width - i * spacing, canvas.height)
          ctx.lineTo(canvas.width, canvas.height - i * spacing)
          ctx.stroke()

          // Additional line
          ctx.beginPath()
          ctx.moveTo(canvas.width - 50 - i * spacing, canvas.height)
          ctx.lineTo(canvas.width, canvas.height - 50 - i * spacing)
          ctx.stroke()
        }
      }

      ctx.globalAlpha = 1
    }

    // Initial draw
    drawAccent()

    // Subtle animation
    let phase = 0
    const animate = () => {
      phase += 0.01

      // Subtle pulsing effect
      const scale = 1 + Math.sin(phase) * 0.05

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(scale, scale)
      drawAccent()
      ctx.restore()

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [position])

  const positionClasses = {
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
  }

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className={`absolute pointer-events-none ${positionClasses[position]} ${className}`}
    />
  )
}

export default BorderAccent

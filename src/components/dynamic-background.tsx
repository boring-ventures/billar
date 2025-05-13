"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface DynamicBackgroundProps {
  className?: string
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ className = "" }) => {
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

    // Line properties
    const lines: {
      x1: number
      y1: number
      x2: number
      y2: number
      width: number
      alpha: number
      speed: number
      direction: number
    }[] = []

    // Create initial lines
    const createLines = () => {
      const lineCount = Math.floor(window.innerWidth / 100) // Adjust density based on screen width

      for (let i = 0; i < lineCount; i++) {
        const x1 = Math.random() * canvas.width
        const y1 = Math.random() * canvas.height
        const length = 100 + Math.random() * 200
        const angle = Math.random() * Math.PI * 2

        lines.push({
          x1,
          y1,
          x2: x1 + Math.cos(angle) * length,
          y2: y1 + Math.sin(angle) * length,
          width: 0.5 + Math.random() * 1,
          alpha: 0.03 + Math.random() * 0.06,
          speed: 0.2 + Math.random() * 0.3,
          direction: Math.random() > 0.5 ? 1 : -1,
        })
      }
    }

    createLines()

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw and update lines
      lines.forEach((line) => {
        // Move the line
        const moveAmount = line.speed
        line.x1 += moveAmount * line.direction
        line.x2 += moveAmount * line.direction

        // If line moves off screen, reset it
        if ((line.direction > 0 && line.x1 > canvas.width + 100) || (line.direction < 0 && line.x2 < -100)) {
          if (line.direction > 0) {
            line.x1 = -100
            line.x2 = line.x1 + (line.x2 - line.x1)
          } else {
            line.x2 = canvas.width + 100
            line.x1 = line.x2 - (line.x2 - line.x1)
          }
          line.y1 = Math.random() * canvas.height
          line.y2 = line.y1 + (Math.random() * 40 - 20)
        }

        // Draw the line
        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.lineWidth = line.width
        ctx.strokeStyle = `rgba(220, 38, 38, ${line.alpha})`
        ctx.stroke()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none z-0 ${className}`} />
}

export default DynamicBackground

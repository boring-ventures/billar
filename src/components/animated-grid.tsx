"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface AnimatedGridProps {
  className?: string
}

export const AnimatedGrid: React.FC<AnimatedGridProps> = ({ className = "" }) => {
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

    // Grid properties
    const gridSize = 50
    const dotSize = 1

    // Animation properties
    let time = 0
    const waveSpeed = 0.0005
    const waveHeight = 0.5

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update time
      time += 1

      // Draw grid
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          // Calculate wave effect
          const distanceFromCenter = Math.sqrt(
            Math.pow((x - canvas.width / 2) / canvas.width, 2) + Math.pow((y - canvas.height / 2) / canvas.height, 2),
          )

          const wave = Math.sin(distanceFromCenter * 10 - time * waveSpeed) * waveHeight
          const alpha = 0.1 + wave * 0.05

          // Draw dot
          ctx.beginPath()
          ctx.arc(x, y, dotSize, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`
          ctx.fill()
        }
      }

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none z-0 opacity-20 ${className}`} />
}

export default AnimatedGrid

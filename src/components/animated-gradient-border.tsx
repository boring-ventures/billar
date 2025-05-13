"use client"

import type React from "react"
import { useRef } from "react"

interface AnimatedGradientBorderProps {
  children: React.ReactNode
  color: "red" | "green"
  className?: string
  thickness?: number
  speed?: number
  rounded?: string
}

export const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({
  children,
  color,
  className = "",
  thickness = 1,
  speed = 1,
  rounded = "xl",
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Define colors based on the prop
  const gradientColors =
    color === "red" ? ["#ef4444", "#b91c1c", "#7f1d1d", "#ef4444"] : ["#10b981", "#059669", "#047857", "#10b981"]

  return (
    <div
      ref={containerRef}
      className={`relative p-[${thickness}px] ${className}`}
      style={{
        borderRadius:
          rounded === "xl"
            ? "0.75rem"
            : rounded === "lg"
              ? "0.5rem"
              : rounded === "md"
                ? "0.375rem"
                : rounded === "sm"
                  ? "0.25rem"
                  : rounded,
        padding: `${thickness}px`,
      }}
    >
      <div
        className="absolute inset-0 rounded-[inherit] z-0"
        style={{
          background: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
          backgroundSize: "300% 100%",
          animation: `gradientMove ${6 / speed}s linear infinite`,
        }}
      />
      <div className="relative z-10 bg-zinc-900 rounded-[inherit] h-full">{children}</div>

      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 300% 0%;
          }
        }
      `}</style>
    </div>
  )
}

export default AnimatedGradientBorder

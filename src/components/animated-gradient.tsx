"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface AnimatedGradientProps {
  opacity?: number
  speed?: number
}

export default function AnimatedGradient({ opacity = 0.1, speed = 0.3 }: AnimatedGradientProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? opacity : 0 }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
      >
        <div className="absolute -inset-[100%] opacity-80">
          <div
            className="absolute inset-0 bg-gradient-conic from-green-500 via-blue-500 to-red-500"
            style={{ 
              filter: "blur(150px)",
              animationDuration: `${60 / speed}s` 
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}

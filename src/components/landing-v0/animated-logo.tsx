"use client"

import type React from "react"
import { motion } from "framer-motion"

interface AnimatedLogoProps {
  size?: number
  className?: string
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = 100, className = "" }) => {
  return (
    <motion.div
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      style={{ width: size, height: size }}
      className={`relative ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer circle with gradient */}
        <circle cx="50" cy="50" r="48" fill="url(#gradient)" stroke="#333333" strokeWidth="2" />

        {/* Inner white circle with 8 */}
        <circle cx="50" cy="50" r="20" fill="white" />

        {/* Number 8 */}
        <path
          d="M50 65C45.5817 65 42 62.7614 42 60C42 58.4223 43.1546 57.0094 45 56.1707C43.1546 55.3321 42 53.9192 42 52.3415C42 49.5801 45.5817 47.3415 50 47.3415C54.4183 47.3415 58 49.5801 58 52.3415C58 53.9192 56.8454 55.3321 55 56.1707C56.8454 57.0094 58 58.4223 58 60C58 62.7614 54.4183 65 50 65ZM50 55.6098C52.7614 55.6098 55 54.5052 55 53.1707C55 51.8362 52.7614 50.7317 50 50.7317C47.2386 50.7317 45 51.8362 45 53.1707C45 54.5052 47.2386 55.6098 50 55.6098ZM50 61.6098C52.7614 61.6098 55 60.5052 55 59.1707C55 57.8362 52.7614 56.7317 50 56.7317C47.2386 56.7317 45 57.8362 45 59.1707C45 60.5052 47.2386 61.6098 50 61.6098Z"
          fill="black"
        />

        {/* Highlight effect */}
        <motion.circle
          cx="35"
          cy="35"
          r="5"
          fill="white"
          fillOpacity="0.2"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
        />

        {/* Define gradient */}
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#000000" />
            <stop offset="0.5" stopColor="#222222" />
            <stop offset="1" stopColor="#000000" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

export default AnimatedLogo

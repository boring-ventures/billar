"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BarChart, TrendingUp, DollarSign, Users, Clock } from "lucide-react"

export default function BusinessIntelligenceAnimation() {
  const [activeTab, setActiveTab] = useState("revenue")
  const [hoverBar, setHoverBar] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const requestRef = useRef<number>()

  // Revenue data
  const revenueData = [65, 59, 80, 81, 56, 55, 72]
  const usageData = [30, 45, 55, 60, 48, 35, 40]
  const customerData = [20, 25, 30, 35, 28, 22, 26]

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setAnimationProgress((prev) => {
        const newProgress = prev + 0.005
        return newProgress > 1 ? 0 : newProgress
      })
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    // Tab switching
    const tabInterval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === "revenue") return "usage"
        if (prev === "usage") return "customers"
        return "revenue"
      })
    }, 8000)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      clearInterval(tabInterval)
    }
  }, [])

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case "revenue":
        return revenueData
      case "usage":
        return usageData
      case "customers":
        return customerData
      default:
        return revenueData
    }
  }

  const currentData = getCurrentData()
  const maxValue = Math.max(...currentData)

  // Get tab icon
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "revenue":
        return <DollarSign className="w-4 h-4" />
      case "usage":
        return <Clock className="w-4 h-4" />
      case "customers":
        return <Users className="w-4 h-4" />
      default:
        return <BarChart className="w-4 h-4" />
    }
  }

  // Get tab title
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "revenue":
        return "Revenue"
      case "usage":
        return "Table Usage"
      case "customers":
        return "Customer Traffic"
      default:
        return ""
    }
  }

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
            style={{
              top: `${20 + i * 15}%`,
              left: 0,
              right: 0,
              scaleX: 0.8 + Math.sin(animationProgress * Math.PI * 2 + i) * 0.2,
            }}
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-red-500 to-transparent"
            style={{
              left: `${20 + i * 15}%`,
              top: 0,
              bottom: 0,
              scaleY: 0.8 + Math.cos(animationProgress * Math.PI * 2 + i) * 0.2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-red-900/30 p-4 flex justify-between items-center">
        <motion.div
          className="text-white font-bold flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BarChart className="w-5 h-5 text-red-500" />
          Business Intelligence Dashboard
        </motion.div>
        <motion.div
          className="text-red-300 text-sm flex items-center gap-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <TrendingUp className="w-3 h-3" />
          Live Data
        </motion.div>
      </div>

      {/* Tab navigation */}
      <div className="absolute top-16 left-0 right-0 flex border-b border-red-900/30">
        {["revenue", "usage", "customers"].map((tab) => (
          <motion.button
            key={tab}
            className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-1
              ${activeTab === tab ? "text-red-500 border-b-2 border-red-500" : "text-gray-400"}`}
            onClick={() => setActiveTab(tab)}
            whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
            animate={{
              borderBottomColor: activeTab === tab ? "rgb(239, 68, 68)" : "transparent",
              color: activeTab === tab ? "rgb(239, 68, 68)" : "rgb(156, 163, 175)",
            }}
          >
            {getTabIcon(tab)}
            {getTabTitle(tab)}
          </motion.button>
        ))}
      </div>

      {/* Chart area */}
      <div className="absolute top-28 left-0 right-0 bottom-16 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Chart title */}
            <div className="mb-4 flex justify-between items-center">
              <div className="text-white font-medium">{getTabTitle(activeTab)} Analysis</div>
              <div className="text-red-500 text-sm">Last 7 Days</div>
            </div>

            {/* Bar chart */}
            <div className="flex-1 flex items-end justify-between gap-2 relative">
              {/* Y-axis */}
              <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between">
                <div className="text-gray-500 text-xs">100%</div>
                <div className="text-gray-500 text-xs">75%</div>
                <div className="text-gray-500 text-xs">50%</div>
                <div className="text-gray-500 text-xs">25%</div>
                <div className="text-gray-500 text-xs">0%</div>
              </div>

              {/* Grid lines */}
              <div className="absolute left-10 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-red-900/20 w-full h-0"></div>
                ))}
              </div>

              {/* Bars */}
              <div className="ml-10 flex-1 flex items-end justify-between">
                {currentData.map((value, index) => (
                  <motion.div
                    key={index}
                    className="relative flex-1 mx-1 flex justify-center"
                    onMouseEnter={() => setHoverBar(index)}
                    onMouseLeave={() => setHoverBar(null)}
                  >
                    <motion.div
                      className="w-full max-w-[30px] bg-red-500 rounded-t"
                      initial={{ height: 0 }}
                      animate={{
                        height: `${(value / maxValue) * 100}%`,
                        backgroundColor: hoverBar === index ? "rgb(220, 38, 38)" : "rgb(239, 68, 68)",
                      }}
                      transition={{ duration: 0.5 }}
                    />

                    {/* Tooltip */}
                    {hoverBar === index && (
                      <motion.div
                        className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white text-xs py-1 px-2 rounded"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {value}%
                      </motion.div>
                    )}

                    {/* X-axis label */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs">
                      Day {index + 1}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Summary stats */}
      <div className="absolute bottom-0 left-0 right-0 bg-red-900/30 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-gray-400 text-xs">Average</div>
            <motion.div
              className="text-white font-bold"
              key={`avg-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {Math.round(currentData.reduce((a, b) => a + b, 0) / currentData.length)}%
            </motion.div>
          </div>

          <div className="text-center">
            <div className="text-gray-400 text-xs">Peak</div>
            <motion.div
              className="text-white font-bold"
              key={`peak-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {Math.max(...currentData)}%
            </motion.div>
          </div>

          <div className="text-center">
            <div className="text-gray-400 text-xs">Growth</div>
            <motion.div
              className="text-white font-bold flex items-center justify-center"
              key={`growth-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
              {Math.round(((currentData[currentData.length - 1] - currentData[0]) / currentData[0]) * 100)}%
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

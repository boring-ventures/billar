"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BarChart, TrendingUp, Users, DollarSign } from "lucide-react"

export default function RefinedAnalyticsAnimation() {
  const [activeTab, setActiveTab] = useState("revenue")
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationProgress((prev) => (prev + 0.01) % 1)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  // Get tab icon
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "revenue":
        return <DollarSign className="w-4 h-4" />
      case "usage":
        return <TrendingUp className="w-4 h-4" />
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {activeTab === "revenue" && (
              <div className="w-full h-full flex flex-col">
                <div className="flex justify-between mb-4">
                  <div>
                    <div className="text-gray-400 text-xs">Total Revenue</div>
                    <div className="text-white text-xl font-bold">$24,580</div>
                    <div className="text-green-500 text-xs flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12.5% from last month
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      className="bg-zinc-800 text-xs px-2 py-1 rounded text-white"
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    >
                      Week
                    </motion.button>
                    <motion.button
                      className="bg-red-900/30 text-xs px-2 py-1 rounded text-red-500"
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    >
                      Month
                    </motion.button>
                    <motion.button
                      className="bg-zinc-800 text-xs px-2 py-1 rounded text-white"
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    >
                      Year
                    </motion.button>
                  </div>
                </div>

                {/* Revenue chart */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 relative">
                    {/* Chart grid */}
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="border-b border-r border-zinc-800/50"></div>
                      ))}
                    </div>

                    {/* Chart data - line */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <motion.path
                        d="M0,80 C40,70 60,20 100,40 C140,60 180,80 220,60 C260,40 280,60 320,50 C360,40 400,10 440,30 C480,50 520,75 560,60 C600,45 640,30 680,35 C720,40 760,55 800,50"
                        strokeWidth="2"
                        stroke="#ef4444"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, delay: 0.5 }}
                        style={{ vectorEffect: "non-scaling-stroke" }}
                      />
                    </svg>

                    {/* Data points */}
                    {[40, 70, 60, 80, 50, 75, 60].map((value, index) => (
                      <motion.div
                        key={index}
                        className="absolute w-2 h-2 bg-red-500 rounded-full"
                        style={{
                          left: `${index * 16.66}%`,
                          bottom: `${value}%`,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, delay: 1 + index * 0.15 }}
                      />
                    ))}
                  </div>

                  {/* X-axis labels */}
                  <div className="flex justify-between mt-2">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((month) => (
                      <div key={month} className="text-gray-500 text-xs">
                        {month}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-zinc-800/60 rounded p-2">
                    <div className="text-gray-400 text-xs">Table Revenue</div>
                    <div className="text-white text-sm font-medium">$16,240</div>
                    <div className="text-green-500 text-xs">+8.2%</div>
                  </div>
                  <div className="bg-zinc-800/60 rounded p-2">
                    <div className="text-gray-400 text-xs">Food & Drinks</div>
                    <div className="text-white text-sm font-medium">$5,830</div>
                    <div className="text-green-500 text-xs">+12.4%</div>
                  </div>
                  <div className="bg-zinc-800/60 rounded p-2">
                    <div className="text-gray-400 text-xs">Memberships</div>
                    <div className="text-white text-sm font-medium">$2,510</div>
                    <div className="text-green-500 text-xs">+24.6%</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "usage" && (
              <div className="w-full h-full flex flex-col">
                <div className="flex justify-between mb-4">
                  <div>
                    <div className="text-gray-400 text-xs">Average Usage</div>
                    <div className="text-white text-xl font-bold">72.4%</div>
                    <div className="text-green-500 text-xs flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8.3% from last month
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      className="bg-red-900/30 text-xs px-2 py-1 rounded text-red-500"
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    >
                      Day
                    </motion.button>
                    <motion.button
                      className="bg-zinc-800 text-xs px-2 py-1 rounded text-white"
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    >
                      Week
                    </motion.button>
                    <motion.button
                      className="bg-zinc-800 text-xs px-2 py-1 rounded text-white"
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    >
                      Month
                    </motion.button>
                  </div>
                </div>

                {/* Usage heatmap */}
                <div className="flex-1 grid grid-rows-6 gap-2">
                  {["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6"].map((table, tableIndex) => (
                    <div key={table} className="flex items-center">
                      <div className="w-16 text-xs text-gray-400">{table}</div>
                      <div className="flex-1 grid grid-cols-12 gap-1">
                        {Array.from({ length: 12 }).map((_, hourIndex) => {
                          // Create a deterministic but varied pattern
                          const hour = hourIndex + 10 // 10am to 10pm
                          const isActive = 
                            (tableIndex === 0 && hour >= 14 && hour <= 20) ||
                            (tableIndex === 1 && hour >= 12 && hour <= 18) ||
                            (tableIndex === 2 && hour >= 16 && hour <= 22) ||
                            (tableIndex === 3 && hour >= 18 && hour <= 22) ||
                            (tableIndex === 4 && hour >= 11 && hour <= 15) ||
                            (tableIndex === 5 && hour >= 13 && hour <= 19);
                            
                          return (
                            <motion.div
                              key={hourIndex}
                              className={`h-full rounded-sm ${
                                isActive ? "bg-red-500" : "bg-zinc-800"
                              }`}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, delay: 0.03 * (hourIndex + tableIndex * 12) }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time labels */}
                <div className="flex justify-between mt-1 text-gray-500 text-xs">
                  <div>10 AM</div>
                  <div>12 PM</div>
                  <div>2 PM</div>
                  <div>4 PM</div>
                  <div>6 PM</div>
                  <div>8 PM</div>
                  <div>10 PM</div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="bg-zinc-800/60 rounded p-2">
                    <div className="text-gray-400 text-xs">Peak Hours</div>
                    <div className="text-white text-sm font-medium">6 PM - 9 PM</div>
                  </div>
                  <div className="bg-zinc-800/60 rounded p-2">
                    <div className="text-gray-400 text-xs">Busiest Day</div>
                    <div className="text-white text-sm font-medium">Saturday</div>
                  </div>
                  <div className="bg-zinc-800/60 rounded p-2">
                    <div className="text-gray-400 text-xs">Avg Duration</div>
                    <div className="text-white text-sm font-medium">2.4 hours</div>
                  </div>
                  <div className="bg-zinc-800/60 rounded p-2">
                    <div className="text-gray-400 text-xs">Turnover Rate</div>
                    <div className="text-white text-sm font-medium">3.2x daily</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "customers" && (
              <div className="w-full h-full flex flex-col">
                <div className="flex justify-between mb-4">
                  <div>
                    <div className="text-gray-400 text-xs">Monthly Visitors</div>
                    <div className="text-white text-xl font-bold">846</div>
                    <div className="text-green-500 text-xs flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +16.8% from last month
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      className="bg-zinc-800 text-xs px-2 py-1 rounded text-white"
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    >
                      Demographics
                    </motion.button>
                    <motion.button
                      className="bg-red-900/30 text-xs px-2 py-1 rounded text-red-500"
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    >
                      Loyalty
                    </motion.button>
                  </div>
                </div>

                {/* Customer tiers */}
                <div className="flex-1 flex flex-col">
                  <div className="mb-2 text-xs text-gray-400">Customer Tiers</div>
                  
                  {/* Tier bars */}
                  <div className="space-y-3 flex-1">
                    {[
                      { name: "Diamond", percent: 8, count: 68, color: "bg-blue-500" },
                      { name: "Gold", percent: 22, count: 186, color: "bg-amber-500" },
                      { name: "Silver", percent: 35, count: 296, color: "bg-zinc-400" },
                      { name: "Bronze", percent: 12, count: 102, color: "bg-amber-800" },
                      { name: "New", percent: 23, count: 194, color: "bg-red-500" },
                    ].map((tier) => (
                      <div key={tier.name} className="flex items-center">
                        <div className="w-16 text-xs text-gray-400">{tier.name}</div>
                        <div className="flex-1 bg-zinc-800 rounded-full h-5 overflow-hidden flex items-center">
                          <motion.div
                            className={`h-full ${tier.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${tier.percent}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <div className="ml-2 text-xs text-white w-8">{tier.percent}%</div>
                        <div className="ml-2 text-xs text-gray-400 w-8">{tier.count}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Customer retention */}
                  <div className="mt-4">
                    <div className="mb-2 text-xs text-gray-400">Customer Retention</div>
                    <div className="bg-zinc-800 rounded-lg p-3 flex space-x-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">30-Day Retention</div>
                        <div className="text-white font-medium">78%</div>
                        <div className="mt-2 bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            className="bg-green-500 h-full"
                            initial={{ width: 0 }}
                            animate={{ width: "78%" }}
                            transition={{ duration: 1, delay: 1 }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">90-Day Retention</div>
                        <div className="text-white font-medium">64%</div>
                        <div className="mt-2 bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            className="bg-amber-500 h-full"
                            initial={{ width: 0 }}
                            animate={{ width: "64%" }}
                            transition={{ duration: 1, delay: 1.2 }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">Annual Retention</div>
                        <div className="text-white font-medium">42%</div>
                        <div className="mt-2 bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            className="bg-red-500 h-full"
                            initial={{ width: 0 }}
                            animate={{ width: "42%" }}
                            transition={{ duration: 1, delay: 1.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-red-900/30 p-3 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Last updated: <span className="text-white">Just now</span>
        </div>
        <motion.button
          className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded-sm flex items-center"
          whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.3)" }}
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Export Data
        </motion.button>
      </div>
    </div>
  )
}

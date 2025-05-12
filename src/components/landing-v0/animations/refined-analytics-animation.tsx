"use client"

import { useEffect, useRef } from "react"
import { motion, useAnimation } from "framer-motion"
import { BarChart, TrendingUp, DollarSign, Users, Clock } from "lucide-react"

export default function RefinedAnalyticsAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  useEffect(() => {
    const sequence = async () => {
      await controls.start("visible")

      // Start the continuous animations after the initial reveal
      controls.start("pulse")
    }

    sequence()
  }, [controls])

  // Chart data
  const chartData = [40, 65, 55, 70, 60, 75, 85]

  return (
    <div ref={containerRef} className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`h-line-${i}`}
            className="absolute h-px bg-red-500/10"
            style={{
              top: `${20 + i * 15}%`,
              left: 0,
              right: 0,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              transition: {
                duration: 3 + i,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              },
            }}
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`v-line-${i}`}
            className="absolute w-px bg-red-500/10"
            style={{
              left: `${20 + i * 15}%`,
              top: 0,
              bottom: 0,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              transition: {
                duration: 4 + i,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              },
            }}
          />
        ))}
      </div>

      {/* Animated border */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: [0, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0],
            transition: {
              duration: 8,
              times: [0, 0.2, 0.5, 0.8, 1],
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            },
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: [0, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0],
            transition: {
              duration: 8,
              times: [0, 0.2, 0.5, 0.8, 1],
              delay: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            },
          }}
        />
        <motion.div
          className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-red-500 to-transparent"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{
            scaleY: [0, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0],
            transition: {
              duration: 8,
              times: [0, 0.2, 0.5, 0.8, 1],
              delay: 1,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            },
          }}
        />
        <motion.div
          className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-red-500 to-transparent"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{
            scaleY: [0, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0],
            transition: {
              duration: 8,
              times: [0, 0.2, 0.5, 0.8, 1],
              delay: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            },
          }}
        />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col">
        <motion.div
          className="flex items-center gap-2 text-white text-xl font-medium mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <BarChart className="h-5 w-5 text-red-500" />
          Business Intelligence
        </motion.div>

        {/* Chart area */}
        <motion.div
          className="bg-zinc-800/50 rounded-lg p-5 border border-red-900/30 mb-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          variants={{
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6 },
            },
            pulse: {
              boxShadow: [
                "0 0 0 rgba(239, 68, 68, 0)",
                "0 0 10px rgba(239, 68, 68, 0.2)",
                "0 0 0 rgba(239, 68, 68, 0)",
              ],
              transition: {
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              },
            },
          }}
        >
          <motion.div
            className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
            animate={{
              opacity: [0.2, 0.8, 0.2],
              transition: { duration: 3, repeat: Number.POSITIVE_INFINITY },
            }}
          />

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-red-500" />
              <h4 className="text-white font-medium">Revenue Analysis</h4>
            </div>
            <motion.div
              className="text-red-500 text-sm flex items-center gap-1"
              animate={{
                opacity: [0.7, 1, 0.7],
                transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
              }}
            >
              <TrendingUp className="h-3 w-3" />
              <span>+15%</span>
            </motion.div>
          </div>

          {/* Bar chart */}
          <div className="h-32 flex items-end justify-between gap-1 mb-2">
            {chartData.map((value, index) => (
              <motion.div
                key={index}
                className="flex-1 bg-red-500/20 rounded-t relative group"
                initial={{ height: 0 }}
                animate={{
                  height: `${value}%`,
                  transition: { duration: 1, delay: index * 0.1 },
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-red-500 opacity-40"
                  animate={{
                    opacity: [0.4, 0.6, 0.4],
                    transition: {
                      duration: 2,
                      delay: index * 0.2,
                      repeat: Number.POSITIVE_INFINITY,
                    },
                  }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-red-500"
                  initial={{ height: "0%" }}
                  animate={{
                    height: "100%",
                    transition: {
                      duration: 1.5,
                      delay: index * 0.1,
                    },
                  }}
                  style={{ height: `${value}%`, opacity: 0.2 }}
                />
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-gray-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-6 flex-1">
          {/* Feature 1 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-red-900/30 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay: 0.2 },
              },
              pulse: {
                boxShadow: [
                  "0 0 0 rgba(239, 68, 68, 0)",
                  "0 0 10px rgba(239, 68, 68, 0.2)",
                  "0 0 0 rgba(239, 68, 68, 0)",
                ],
                transition: {
                  duration: 4,
                  delay: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                },
              },
            }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                transition: { duration: 3, delay: 0.5, repeat: Number.POSITIVE_INFINITY },
              }}
            />

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-red-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, delay: 0.5, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <DollarSign className="h-6 w-6 text-red-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Financial Reports</h4>
                <p className="text-gray-400 text-sm">Comprehensive reporting and forecasting</p>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-red-900/30 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay: 0.4 },
              },
              pulse: {
                boxShadow: [
                  "0 0 0 rgba(239, 68, 68, 0)",
                  "0 0 10px rgba(239, 68, 68, 0.2)",
                  "0 0 0 rgba(239, 68, 68, 0)",
                ],
                transition: {
                  duration: 4,
                  delay: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                },
              },
            }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                transition: { duration: 3, delay: 1, repeat: Number.POSITIVE_INFINITY },
              }}
            />

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-red-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, delay: 1, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <Clock className="h-6 w-6 text-red-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Peak Analysis</h4>
                <p className="text-gray-400 text-sm">Optimize staffing and promotions</p>
              </div>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-red-900/30 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay: 0.6 },
              },
              pulse: {
                boxShadow: [
                  "0 0 0 rgba(239, 68, 68, 0)",
                  "0 0 10px rgba(239, 68, 68, 0.2)",
                  "0 0 0 rgba(239, 68, 68, 0)",
                ],
                transition: {
                  duration: 4,
                  delay: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                },
              },
            }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                transition: { duration: 3, delay: 1.5, repeat: Number.POSITIVE_INFINITY },
              }}
            />

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-red-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, delay: 1.5, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <Users className="h-6 w-6 text-red-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Inventory</h4>
                <p className="text-gray-400 text-sm">Track food, beverages, and equipment</p>
              </div>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-red-900/30 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay: 0.8 },
              },
              pulse: {
                boxShadow: [
                  "0 0 0 rgba(239, 68, 68, 0)",
                  "0 0 10px rgba(239, 68, 68, 0.2)",
                  "0 0 0 rgba(239, 68, 68, 0)",
                ],
                transition: {
                  duration: 4,
                  delay: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                },
              },
            }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                transition: { duration: 3, delay: 2, repeat: Number.POSITIVE_INFINITY },
              }}
            />

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-red-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, delay: 2, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <BarChart className="h-6 w-6 text-red-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">KPI Dashboard</h4>
                <p className="text-gray-400 text-sm">Customizable performance indicators</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

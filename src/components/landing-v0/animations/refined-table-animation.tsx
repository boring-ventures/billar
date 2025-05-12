"use client"

import { useEffect, useRef } from "react"
import { motion, useAnimation } from "framer-motion"
import { Calendar, Clock, Settings, Activity } from "lucide-react"

export default function RefinedTableAnimation() {
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

  return (
    <div ref={containerRef} className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="table-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ef444420" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#table-grid)" />
        </svg>
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
          className="text-white text-xl font-medium mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          Table Management System
        </motion.div>

        <div className="flex-1 grid grid-cols-2 gap-6">
          {/* Feature 1 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-red-900/30 relative overflow-hidden"
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

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-red-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <Calendar className="h-6 w-6 text-red-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Booking System</h4>
                <p className="text-gray-400 text-sm">Real-time table reservations with visual status indicators</p>
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
                <Clock className="h-6 w-6 text-red-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Time Tracking</h4>
                <p className="text-gray-400 text-sm">Automated usage monitoring with custom rate structures</p>
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
                <Settings className="h-6 w-6 text-red-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Maintenance</h4>
                <p className="text-gray-400 text-sm">Scheduled maintenance tracking for each table</p>
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
                <Activity className="h-6 w-6 text-red-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Analytics</h4>
                <p className="text-gray-400 text-sm">Utilization metrics to optimize table placement</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Status indicators */}
        <motion.div
          className="mt-6 grid grid-cols-6 gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                initial={{ width: "0%" }}
                animate={{
                  width: i % 2 === 0 ? "85%" : "40%",
                  transition: {
                    duration: 2,
                    delay: i * 0.2,
                  },
                }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

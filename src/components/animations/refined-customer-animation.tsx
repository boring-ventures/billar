"use client"

import React, { useState, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { User, Award, Star, Gift, MessageSquare } from "lucide-react"

export default function RefinedCustomerAnimation() {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const controls = useAnimation()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    const sequence = async () => {
      await controls.start("visible")

      // Start the continuous animations after the initial reveal
      controls.start("pulse")
    }

    sequence()

    return () => {
      clearTimeout(timer)
    }
  }, [controls])

  const colors = {
    background: "#1a1a1a",
    border: "#404040",
    primary: "#10b981", // green-500
    secondary: "#ef4444", // red-500
    highlight: "#3b82f6", // blue-500
    gridLine: "#333333",
    text: "#ffffff",
  }

  const customers = [
    {
      id: 1,
      name: "Alex Johnson",
      email: "alex@example.com",
      visits: 32,
      lastVisit: "2 days ago",
      spent: 758.50,
      loyaltyPoints: 1250,
      status: "active",
      preferredTable: 3,
      avatarColor: "#3b82f6",
    },
    {
      id: 2,
      name: "Maria Garcia",
      email: "maria@example.com",
      visits: 28,
      lastVisit: "Today",
      spent: 642.75,
      loyaltyPoints: 980,
      status: "active",
      preferredTable: 6,
      avatarColor: "#ec4899",
    },
    {
      id: 3,
      name: "James Wilson",
      email: "james@example.com",
      visits: 15,
      lastVisit: "1 week ago",
      spent: 340.25,
      loyaltyPoints: 520,
      status: "inactive",
      preferredTable: 1,
      avatarColor: "#f59e0b",
    },
    {
      id: 4,
      name: "Sarah Chen",
      email: "sarah@example.com",
      visits: 42,
      lastVisit: "Yesterday",
      spent: 1205.00,
      loyaltyPoints: 1850,
      status: "vip",
      preferredTable: 2,
      avatarColor: "#10b981",
    },
    {
      id: 5,
      name: "David Kim",
      email: "david@example.com",
      visits: 8,
      lastVisit: "3 days ago",
      spent: 182.50,
      loyaltyPoints: 250,
      status: "active",
      preferredTable: 4,
      avatarColor: "#6366f1",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "vip":
        return "#f59e0b" // amber-500
      case "active":
        return "#10b981" // green-500
      case "inactive":
        return "#6b7280" // gray-500
      default:
        return colors.border
    }
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="customer-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#10b98120" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#customer-grid)" />
        </svg>
      </div>

      {/* Animated border */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent"
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
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent"
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
          className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-green-500 to-transparent"
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
          className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-green-500 to-transparent"
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
          Customer Engagement Portal
        </motion.div>

        {/* Customer profile */}
        <motion.div
          className="bg-zinc-800/50 rounded-lg p-5 border border-green-900/30 mb-6 relative overflow-hidden"
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
                "0 0 0 rgba(16, 185, 129, 0)",
                "0 0 10px rgba(16, 185, 129, 0.2)",
                "0 0 0 rgba(16, 185, 129, 0)",
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
            className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent"
            animate={{
              opacity: [0.2, 0.8, 0.2],
              transition: { duration: 3, repeat: Number.POSITIVE_INFINITY },
            }}
          />

          <div className="flex items-start">
            <motion.div
              className="w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center mr-4"
              animate={{
                scale: [1, 1.05, 1],
                transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
              }}
            >
              <User className="h-6 w-6 text-green-500" />
            </motion.div>

            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="text-white font-medium">Alex Johnson</h3>
                <div className="flex items-center">
                  <span className="text-green-500 mr-1 text-sm">Gold</span>
                  <Award className="w-4 h-4 text-green-500" />
                </div>
              </div>

              <div className="text-gray-400 text-sm">Last visit: 2 days ago</div>

              <div className="mt-2 flex items-center">
                <div className="text-gray-400 text-sm mr-2">Visits: 24</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= 4 ? "text-green-500" : "text-gray-600"}`}
                      fill={star <= 4 ? "#10b981" : "none"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-6 flex-1">
          {/* Feature 1 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-green-900/30 relative overflow-hidden"
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
                  "0 0 0 rgba(16, 185, 129, 0)",
                  "0 0 10px rgba(16, 185, 129, 0.2)",
                  "0 0 0 rgba(16, 185, 129, 0)",
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
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                transition: { duration: 3, delay: 0.5, repeat: Number.POSITIVE_INFINITY },
              }}
            />

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-green-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, delay: 0.5, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <User className="h-6 w-6 text-green-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Profiles</h4>
                <p className="text-gray-400 text-sm">Detailed customer history and preferences</p>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-green-900/30 relative overflow-hidden"
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
                  "0 0 0 rgba(16, 185, 129, 0)",
                  "0 0 10px rgba(16, 185, 129, 0.2)",
                  "0 0 0 rgba(16, 185, 129, 0)",
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
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                transition: { duration: 3, delay: 1, repeat: Number.POSITIVE_INFINITY },
              }}
            />

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-green-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, delay: 1, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <Award className="h-6 w-6 text-green-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Loyalty</h4>
                <p className="text-gray-400 text-sm">Automated rewards program with tiers</p>
              </div>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-green-900/30 relative overflow-hidden"
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
                  "0 0 0 rgba(16, 185, 129, 0)",
                  "0 0 10px rgba(16, 185, 129, 0.2)",
                  "0 0 0 rgba(16, 185, 129, 0)",
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
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                transition: { duration: 3, delay: 1.5, repeat: Number.POSITIVE_INFINITY },
              }}
            />

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-green-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, delay: 1.5, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <Gift className="h-6 w-6 text-green-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Promotions</h4>
                <p className="text-gray-400 text-sm">Targeted offers based on behavior</p>
              </div>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            className="bg-zinc-800/50 rounded-lg p-5 border border-green-900/30 relative overflow-hidden"
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
                  "0 0 0 rgba(16, 185, 129, 0)",
                  "0 0 10px rgba(16, 185, 129, 0.2)",
                  "0 0 0 rgba(16, 185, 129, 0)",
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
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                transition: { duration: 3, delay: 2, repeat: Number.POSITIVE_INFINITY },
              }}
            />

            <div className="flex items-start">
              <motion.div
                className="mr-4 p-2 rounded-full bg-green-900/20"
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 2, delay: 2, repeat: Number.POSITIVE_INFINITY },
                }}
              >
                <MessageSquare className="h-6 w-6 text-green-500" />
              </motion.div>
              <div>
                <h4 className="text-white font-medium mb-1">Communication</h4>
                <p className="text-gray-400 text-sm">Integrated messaging and notifications</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity indicators */}
        <motion.div
          className="mt-6 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500"
              initial={{ width: "0%" }}
              animate={{
                width: "75%",
                transition: { duration: 2 },
              }}
            />
          </div>
          <div className="text-green-500 text-xs">Active</div>
        </motion.div>
      </div>
    </div>
  )
}

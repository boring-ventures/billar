"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Star, MessageSquare, Gift, Award } from "lucide-react"

export default function CustomerEngagementAnimation() {
  const [activeCustomer, setActiveCustomer] = useState(0)
  const [showMessage, setShowMessage] = useState(false)
  const [showReward, setShowReward] = useState(false)

  // Customer profiles
  const customers = [
    {
      id: 1,
      name: "Alex Johnson",
      visits: 24,
      level: "Gold",
      lastVisit: "2 days ago",
      preferences: ["Table 3", "Evening slots", "Tournaments"],
      color: "#10b981", // green
    },
    {
      id: 2,
      name: "Sam Wilson",
      visits: 12,
      level: "Silver",
      lastVisit: "1 week ago",
      preferences: ["Table 5", "Weekend", "Casual play"],
      color: "#10b981", // green
    },
    {
      id: 3,
      name: "Taylor Reed",
      visits: 36,
      level: "Platinum",
      lastVisit: "Yesterday",
      preferences: ["Table 1", "Afternoons", "Private room"],
      color: "#10b981", // green
    },
  ]

  // Animation cycle
  useEffect(() => {
    // Cycle through customers
    const customerInterval = setInterval(() => {
      setActiveCustomer((prev) => (prev + 1) % customers.length)
      setShowMessage(false)
      setShowReward(false)
    }, 5000)

    // Show message notification
    const messageInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        setShowMessage(true)
        setTimeout(() => setShowMessage(false), 3000)
      }
    }, 3000)

    // Show reward notification
    const rewardInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setShowReward(true)
        setTimeout(() => setShowReward(false), 3000)
      }
    }, 4000)

    return () => {
      clearInterval(customerInterval)
      clearInterval(messageInterval)
      clearInterval(rewardInterval)
    }
  }, [customers.length])

  const customer = customers[activeCustomer]

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b98120" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-green-900/30 p-4 flex justify-between items-center">
        <motion.div
          className="text-white font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Customer Engagement Portal
        </motion.div>
        <motion.div
          className="text-green-300 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          Active Profiles
        </motion.div>
      </div>

      {/* Customer profile */}
      <AnimatePresence mode="wait">
        <motion.div
          key={customer.id}
          className="absolute top-20 left-0 right-0 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <motion.div
              className="w-16 h-16 rounded-full bg-green-600/30 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(16, 185, 129, 0)",
                  "0 0 15px rgba(16, 185, 129, 0.5)",
                  "0 0 0px rgba(16, 185, 129, 0)",
                ],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <User className="w-8 h-8 text-green-500" />
            </motion.div>

            {/* Customer info */}
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="text-white font-bold text-lg">{customer.name}</h3>
                <div className="flex items-center">
                  <span className="text-green-500 mr-1">{customer.level}</span>
                  <Award className="w-4 h-4 text-green-500" />
                </div>
              </div>

              <div className="text-gray-400 text-sm">Last visit: {customer.lastVisit}</div>

              <div className="mt-2 flex items-center">
                <div className="text-gray-400 text-sm mr-2">Visits: {customer.visits}</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= Math.min(5, Math.floor(customer.visits / 5)) ? "text-green-500" : "text-gray-600"}`}
                      fill={star <= Math.min(5, Math.floor(customer.visits / 5)) ? "#10b981" : "none"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-2">Preferences:</div>
            <div className="flex flex-wrap gap-2">
              {customer.preferences.map((pref, index) => (
                <motion.div
                  key={index}
                  className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {pref}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity timeline */}
          <div className="mt-6">
            <div className="text-gray-400 text-sm mb-2">Recent Activity:</div>
            <div className="space-y-3">
              <motion.div
                className="bg-zinc-800/50 p-2 rounded-md flex items-center"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div className="text-gray-300 text-xs">Booked Table 3 for tomorrow at 7 PM</div>
              </motion.div>

              <motion.div
                className="bg-zinc-800/50 p-2 rounded-md flex items-center"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div className="text-gray-300 text-xs">Earned 50 loyalty points last visit</div>
              </motion.div>

              <motion.div
                className="bg-zinc-800/50 p-2 rounded-md flex items-center"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div className="text-gray-300 text-xs">Participated in weekend tournament</div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Notification area */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <AnimatePresence>
          {showMessage && (
            <motion.div
              className="bg-green-600/90 p-3 rounded-md flex items-center gap-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <div className="text-white text-xs">New message sent to {customer.name}</div>
            </motion.div>
          )}

          {showReward && (
            <motion.div
              className="bg-green-600/90 p-3 rounded-md flex items-center gap-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <Gift className="w-4 h-4 text-white" />
              <div className="text-white text-xs">Loyalty reward unlocked!</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

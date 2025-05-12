"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function TableManagementAnimation() {
  const [activeTable, setActiveTable] = useState<number | null>(null)
  const [bookedTables, setBookedTables] = useState<number[]>([])
  const [timeElapsed, setTimeElapsed] = useState(0)

  // Table positions
  const tables = [
    { id: 1, x: "20%", y: "25%" },
    { id: 2, x: "50%", y: "25%" },
    { id: 3, x: "80%", y: "25%" },
    { id: 4, x: "20%", y: "65%" },
    { id: 5, x: "50%", y: "65%" },
    { id: 6, x: "80%", y: "65%" },
  ]

  // Animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)

      // Every 3 seconds, book or unbook a random table
      if (timeElapsed % 3 === 0) {
        const availableTables = tables.filter((t) => !bookedTables.includes(t.id)).map((t) => t.id)

        if (availableTables.length > 0 && Math.random() > 0.3) {
          // Book a random available table
          const tableToBook = availableTables[Math.floor(Math.random() * availableTables.length)]
          setBookedTables((prev) => [...prev, tableToBook])
          setActiveTable(tableToBook)
        } else if (bookedTables.length > 0) {
          // Unbook a random booked table
          const tableToUnbook = bookedTables[Math.floor(Math.random() * bookedTables.length)]
          setBookedTables((prev) => prev.filter((id) => id !== tableToUnbook))
          setActiveTable(tableToUnbook)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timeElapsed, bookedTables, tables])

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-10">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="border border-red-500/20"></div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-red-900/30 p-4 flex justify-between items-center">
        <motion.div
          className="text-white font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Table Management Dashboard
        </motion.div>
        <motion.div
          className="text-red-300 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          Live View
        </motion.div>
      </div>

      {/* Tables */}
      {tables.map((table) => (
        <motion.div
          key={table.id}
          className={`absolute w-[15%] h-[15%] rounded-md flex items-center justify-center 
            ${bookedTables.includes(table.id) ? "bg-red-600" : "bg-red-900/40"}`}
          style={{ left: table.x, top: table.y, transform: "translate(-50%, -50%)" }}
          animate={{
            scale: activeTable === table.id ? [1, 1.1, 1] : 1,
            boxShadow: bookedTables.includes(table.id)
              ? "0 0 15px rgba(239, 68, 68, 0.5)"
              : "0 0 0px rgba(239, 68, 68, 0)",
          }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-white font-medium">T{table.id}</span>

          {/* Status indicator */}
          <motion.div
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full 
              ${bookedTables.includes(table.id) ? "bg-red-500" : "bg-green-500"}`}
            animate={{
              scale: bookedTables.includes(table.id) ? [1, 1.2, 1] : 1,
              opacity: bookedTables.includes(table.id) ? 1 : 0.7,
            }}
            transition={{
              duration: 1,
              repeat: bookedTables.includes(table.id) ? Number.POSITIVE_INFINITY : 0,
              repeatType: "reverse",
            }}
          />
        </motion.div>
      ))}

      {/* Time tracking indicators */}
      <div className="absolute bottom-0 left-0 right-0 bg-red-900/30 p-4">
        <div className="flex justify-between items-center">
          <div className="text-white text-sm">
            Active Tables: {bookedTables.length}/{tables.length}
          </div>
          <div className="text-white text-sm">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Usage bars */}
        <div className="mt-2 grid grid-cols-6 gap-2">
          {tables.map((table) => (
            <motion.div key={table.id} className="h-1 bg-red-900/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                initial={{ width: "0%" }}
                animate={{
                  width: bookedTables.includes(table.id) ? `${Math.min(100, (timeElapsed % 20) * 5)}%` : "0%",
                }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {activeTable && (
          <motion.div
            className={`absolute right-4 top-16 p-3 rounded-md ${
              bookedTables.includes(activeTable) ? "bg-red-600/90" : "bg-green-600/90"
            }`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-white text-sm font-medium">
              Table {activeTable} {bookedTables.includes(activeTable) ? "Booked" : "Available"}
            </div>
            <div className="text-white/70 text-xs">
              {bookedTables.includes(activeTable) ? "Time started: Just now" : "Duration: 45 minutes"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

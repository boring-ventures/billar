"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/format-duration";

interface SessionTimerProps {
  startTime: Date;
  onTimeUpdate?: (elapsedSeconds: number) => void;
  isActive?: boolean;
}

export function SessionTimer({
  startTime,
  onTimeUpdate,
  isActive = true,
}: SessionTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Calculate initial elapsed time
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const initialElapsed = Math.floor((now - start) / 1000);
    setElapsedTime(initialElapsed);

    // Don't start the timer if not active
    if (!isActive) {
      if (onTimeUpdate) {
        onTimeUpdate(initialElapsed);
      }
      return;
    }

    // Start timer
    const timer = setInterval(() => {
      const currentElapsed = Math.floor((new Date().getTime() - start) / 1000);
      setElapsedTime(currentElapsed);

      if (onTimeUpdate) {
        onTimeUpdate(currentElapsed);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, isActive, onTimeUpdate]);

  // Format the display time
  const formattedTime = formatDuration(elapsedTime);

  return (
    <div className="flex items-center gap-2 text-lg font-semibold">
      <Clock className="h-5 w-5" />
      <span>{formattedTime}</span>
    </div>
  );
}

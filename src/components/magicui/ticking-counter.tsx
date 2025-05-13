"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TickingCounterProps {
  from?: number;
  to: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function TickingCounter({
  from = 0,
  to,
  duration = 2,
  formatter = (value: number) => Math.round(value).toString(),
  className,
  prefix = "",
  suffix = "",
}: TickingCounterProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    // Skip animation for SSR
    if (typeof window === "undefined") {
      setCount(to);
      return;
    }

    const startTime = Date.now();
    const difference = to - from;

    // If there's no difference, just set the final value
    if (difference === 0) {
      setCount(to);
      return;
    }

    // Animation function
    const updateCount = () => {
      const now = Date.now();
      const elapsedTime = Math.min(duration * 1000, now - startTime);
      const progress = elapsedTime / (duration * 1000);

      // Easing function: easeOutQuad
      const easeProgress = 1 - (1 - progress) * (1 - progress);

      const currentCount = from + difference * easeProgress;

      setCount(currentCount);

      if (elapsedTime < duration * 1000) {
        requestAnimationFrame(updateCount);
      } else {
        // Ensure we end at exactly the target value
        setCount(to);
      }
    };

    requestAnimationFrame(updateCount);

    // Cleanup
    return () => {
      // No cleanup needed for requestAnimationFrame
    };
  }, [from, to, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formatter(count)}
      {suffix}
    </span>
  );
}

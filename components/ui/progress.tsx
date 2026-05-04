"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <motion.div
      className="h-full bg-primary"
      initial={{ width: 0 }}
      animate={{ width: `${value || 0}%` }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }

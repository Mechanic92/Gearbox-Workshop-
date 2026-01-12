import * as React from "react"
import { cn } from "@/lib/utils"

export const Progress = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Progress.displayName = "Progress"

export const ProgressTrigger = Progress
export const ProgressContent = Progress
export const ProgressHeader = Progress
export const ProgressFooter = Progress
export const ProgressTitle = Progress
export const ProgressDescription = Progress
export const ProgressLabel = Progress
export const ProgressItem = Progress
export const ProgressSeparator = Progress
export const ProgressGroup = Progress
export const ProgressValue = Progress
export const ProgressList = Progress
export const ProgressPanel = Progress
export const ProgressPortal = Progress
export const ProgressOverlay = Progress
export const ProgressAction = Progress
export const ProgressCancel = Progress
export const ProgressInput = Progress
export const ProgressEmpty = Progress
export const ProgressCheckboxItem = Progress

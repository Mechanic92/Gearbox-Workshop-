import * as React from "react"
import { cn } from "@/lib/utils"

export const Badge = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)} {...props}>
    {children}
  </div>
))
Badge.displayName = "Badge"

export const BadgeTrigger = Badge
export const BadgeContent = Badge
export const BadgeHeader = Badge
export const BadgeFooter = Badge
export const BadgeTitle = Badge
export const BadgeDescription = Badge
export const BadgeLabel = Badge
export const BadgeItem = Badge
export const BadgeSeparator = Badge
export const BadgeGroup = Badge
export const BadgeValue = Badge
export const BadgeList = Badge
export const BadgePanel = Badge
export const BadgePortal = Badge
export const BadgeOverlay = Badge
export const BadgeAction = Badge
export const BadgeCancel = Badge
export const BadgeInput = Badge
export const BadgeEmpty = Badge
export const BadgeCheckboxItem = Badge

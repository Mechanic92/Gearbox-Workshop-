import * as React from "react"
import { cn } from "@/lib/utils"

export const Tooltip = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Tooltip.displayName = "Tooltip"

export const TooltipTrigger = Tooltip
export const TooltipContent = Tooltip
export const TooltipHeader = Tooltip
export const TooltipFooter = Tooltip
export const TooltipTitle = Tooltip
export const TooltipDescription = Tooltip
export const TooltipLabel = Tooltip
export const TooltipItem = Tooltip
export const TooltipSeparator = Tooltip
export const TooltipGroup = Tooltip
export const TooltipValue = Tooltip
export const TooltipList = Tooltip
export const TooltipPanel = Tooltip
export const TooltipPortal = Tooltip
export const TooltipOverlay = Tooltip
export const TooltipAction = Tooltip
export const TooltipCancel = Tooltip
export const TooltipInput = Tooltip
export const TooltipEmpty = Tooltip
export const TooltipCheckboxItem = Tooltip
export const TooltipProvider = Tooltip

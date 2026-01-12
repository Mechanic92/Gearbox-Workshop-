import * as React from "react"
import { cn } from "@/lib/utils"

export const Popover = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Popover.displayName = "Popover"

export const PopoverTrigger = Popover
export const PopoverContent = Popover
export const PopoverHeader = Popover
export const PopoverFooter = Popover
export const PopoverTitle = Popover
export const PopoverDescription = Popover
export const PopoverLabel = Popover
export const PopoverItem = Popover
export const PopoverSeparator = Popover
export const PopoverGroup = Popover
export const PopoverValue = Popover
export const PopoverList = Popover
export const PopoverPanel = Popover
export const PopoverPortal = Popover
export const PopoverOverlay = Popover
export const PopoverAction = Popover
export const PopoverCancel = Popover
export const PopoverInput = Popover
export const PopoverEmpty = Popover
export const PopoverCheckboxItem = Popover

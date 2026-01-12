import * as React from "react"
import { cn } from "@/lib/utils"

export const ScrollArea = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
ScrollArea.displayName = "ScrollArea"

export const ScrollAreaTrigger = ScrollArea
export const ScrollAreaContent = ScrollArea
export const ScrollAreaHeader = ScrollArea
export const ScrollAreaFooter = ScrollArea
export const ScrollAreaTitle = ScrollArea
export const ScrollAreaDescription = ScrollArea
export const ScrollAreaLabel = ScrollArea
export const ScrollAreaItem = ScrollArea
export const ScrollAreaSeparator = ScrollArea
export const ScrollAreaGroup = ScrollArea
export const ScrollAreaValue = ScrollArea
export const ScrollAreaList = ScrollArea
export const ScrollAreaPanel = ScrollArea
export const ScrollAreaPortal = ScrollArea
export const ScrollAreaOverlay = ScrollArea
export const ScrollAreaAction = ScrollArea
export const ScrollAreaCancel = ScrollArea
export const ScrollAreaInput = ScrollArea
export const ScrollAreaEmpty = ScrollArea
export const ScrollAreaCheckboxItem = ScrollArea

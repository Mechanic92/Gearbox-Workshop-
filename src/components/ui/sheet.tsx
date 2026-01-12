import * as React from "react"
import { cn } from "@/lib/utils"

export const Sheet = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Sheet.displayName = "Sheet"

export const SheetTrigger = Sheet
export const SheetContent = Sheet
export const SheetHeader = Sheet
export const SheetFooter = Sheet
export const SheetTitle = Sheet
export const SheetDescription = Sheet
export const SheetLabel = Sheet
export const SheetItem = Sheet
export const SheetSeparator = Sheet
export const SheetGroup = Sheet
export const SheetValue = Sheet
export const SheetList = Sheet
export const SheetPanel = Sheet
export const SheetPortal = Sheet
export const SheetOverlay = Sheet
export const SheetAction = Sheet
export const SheetCancel = Sheet
export const SheetInput = Sheet
export const SheetEmpty = Sheet
export const SheetCheckboxItem = Sheet

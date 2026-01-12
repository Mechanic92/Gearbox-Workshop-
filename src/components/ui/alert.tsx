import * as React from "react"
import { cn } from "@/lib/utils"

export const Alert = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Alert.displayName = "Alert"

export const AlertTrigger = Alert
export const AlertContent = Alert
export const AlertHeader = Alert
export const AlertFooter = Alert
export const AlertTitle = Alert
export const AlertDescription = Alert
export const AlertLabel = Alert
export const AlertItem = Alert
export const AlertSeparator = Alert
export const AlertGroup = Alert
export const AlertValue = Alert
export const AlertList = Alert
export const AlertPanel = Alert
export const AlertPortal = Alert
export const AlertOverlay = Alert
export const AlertAction = Alert
export const AlertCancel = Alert
export const AlertInput = Alert
export const AlertEmpty = Alert
export const AlertCheckboxItem = Alert

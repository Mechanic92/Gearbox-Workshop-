import * as React from "react"
import { cn } from "@/lib/utils"

export const Label = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props}>
    {children}
  </label>
))
Label.displayName = "Label"

export const LabelTrigger = Label
export const LabelContent = Label
export const LabelHeader = Label
export const LabelFooter = Label
export const LabelTitle = Label
export const LabelDescription = Label
export const LabelLabel = Label
export const LabelItem = Label
export const LabelSeparator = Label
export const LabelGroup = Label
export const LabelValue = Label
export const LabelList = Label
export const LabelPanel = Label
export const LabelPortal = Label
export const LabelOverlay = Label
export const LabelAction = Label
export const LabelCancel = Label
export const LabelInput = Label
export const LabelEmpty = Label
export const LabelCheckboxItem = Label

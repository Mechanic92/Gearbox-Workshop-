import * as React from "react"
import { cn } from "@/lib/utils"

export const RadioGroup = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
RadioGroup.displayName = "RadioGroup"

export const RadioGroupTrigger = RadioGroup
export const RadioGroupContent = RadioGroup
export const RadioGroupHeader = RadioGroup
export const RadioGroupFooter = RadioGroup
export const RadioGroupTitle = RadioGroup
export const RadioGroupDescription = RadioGroup
export const RadioGroupLabel = RadioGroup
export const RadioGroupItem = RadioGroup
export const RadioGroupSeparator = RadioGroup
export const RadioGroupGroup = RadioGroup
export const RadioGroupValue = RadioGroup
export const RadioGroupList = RadioGroup
export const RadioGroupPanel = RadioGroup
export const RadioGroupPortal = RadioGroup
export const RadioGroupOverlay = RadioGroup
export const RadioGroupAction = RadioGroup
export const RadioGroupCancel = RadioGroup
export const RadioGroupInput = RadioGroup
export const RadioGroupEmpty = RadioGroup
export const RadioGroupCheckboxItem = RadioGroup

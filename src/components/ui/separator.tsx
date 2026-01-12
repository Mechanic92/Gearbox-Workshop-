import * as React from "react"
import { cn } from "@/lib/utils"

export const Separator = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Separator.displayName = "Separator"

export const SeparatorTrigger = Separator
export const SeparatorContent = Separator
export const SeparatorHeader = Separator
export const SeparatorFooter = Separator
export const SeparatorTitle = Separator
export const SeparatorDescription = Separator
export const SeparatorLabel = Separator
export const SeparatorItem = Separator
export const SeparatorSeparator = Separator
export const SeparatorGroup = Separator
export const SeparatorValue = Separator
export const SeparatorList = Separator
export const SeparatorPanel = Separator
export const SeparatorPortal = Separator
export const SeparatorOverlay = Separator
export const SeparatorAction = Separator
export const SeparatorCancel = Separator
export const SeparatorInput = Separator
export const SeparatorEmpty = Separator
export const SeparatorCheckboxItem = Separator

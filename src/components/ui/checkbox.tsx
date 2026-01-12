import * as React from "react"
import { cn } from "@/lib/utils"

export const Checkbox = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Checkbox.displayName = "Checkbox"

export const CheckboxTrigger = Checkbox
export const CheckboxContent = Checkbox
export const CheckboxHeader = Checkbox
export const CheckboxFooter = Checkbox
export const CheckboxTitle = Checkbox
export const CheckboxDescription = Checkbox
export const CheckboxLabel = Checkbox
export const CheckboxItem = Checkbox
export const CheckboxSeparator = Checkbox
export const CheckboxGroup = Checkbox
export const CheckboxValue = Checkbox
export const CheckboxList = Checkbox
export const CheckboxPanel = Checkbox
export const CheckboxPortal = Checkbox
export const CheckboxOverlay = Checkbox
export const CheckboxAction = Checkbox
export const CheckboxCancel = Checkbox
export const CheckboxInput = Checkbox
export const CheckboxEmpty = Checkbox
export const CheckboxCheckboxItem = Checkbox

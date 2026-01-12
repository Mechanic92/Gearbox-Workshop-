import * as React from "react"
import { cn } from "@/lib/utils"

export const Input = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
    {children}
  </input>
))
Input.displayName = "Input"

export const InputTrigger = Input
export const InputContent = Input
export const InputHeader = Input
export const InputFooter = Input
export const InputTitle = Input
export const InputDescription = Input
export const InputLabel = Input
export const InputItem = Input
export const InputSeparator = Input
export const InputGroup = Input
export const InputValue = Input
export const InputList = Input
export const InputPanel = Input
export const InputPortal = Input
export const InputOverlay = Input
export const InputAction = Input
export const InputCancel = Input
export const InputInput = Input
export const InputEmpty = Input
export const InputCheckboxItem = Input

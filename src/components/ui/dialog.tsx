import * as React from "react"
import { cn } from "@/lib/utils"

export const Dialog = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Dialog.displayName = "Dialog"

export const DialogTrigger = Dialog
export const DialogContent = Dialog
export const DialogHeader = Dialog
export const DialogFooter = Dialog
export const DialogTitle = Dialog
export const DialogDescription = Dialog
export const DialogLabel = Dialog
export const DialogItem = Dialog
export const DialogSeparator = Dialog
export const DialogGroup = Dialog
export const DialogValue = Dialog
export const DialogList = Dialog
export const DialogPanel = Dialog
export const DialogPortal = Dialog
export const DialogOverlay = Dialog
export const DialogAction = Dialog
export const DialogCancel = Dialog
export const DialogInput = Dialog
export const DialogEmpty = Dialog
export const DialogCheckboxItem = Dialog

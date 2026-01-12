import * as React from "react"
import { cn } from "@/lib/utils"

export const Textarea = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <textarea ref={ref} className={cn("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
    {children}
  </textarea>
))
Textarea.displayName = "Textarea"

export const TextareaTrigger = Textarea
export const TextareaContent = Textarea
export const TextareaHeader = Textarea
export const TextareaFooter = Textarea
export const TextareaTitle = Textarea
export const TextareaDescription = Textarea
export const TextareaLabel = Textarea
export const TextareaItem = Textarea
export const TextareaSeparator = Textarea
export const TextareaGroup = Textarea
export const TextareaValue = Textarea
export const TextareaList = Textarea
export const TextareaPanel = Textarea
export const TextareaPortal = Textarea
export const TextareaOverlay = Textarea
export const TextareaAction = Textarea
export const TextareaCancel = Textarea
export const TextareaInput = Textarea
export const TextareaEmpty = Textarea
export const TextareaCheckboxItem = Textarea

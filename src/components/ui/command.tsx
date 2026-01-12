import * as React from "react"
import { cn } from "@/lib/utils"

export const Command = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Command.displayName = "Command"

export const CommandTrigger = Command
export const CommandContent = Command
export const CommandHeader = Command
export const CommandFooter = Command
export const CommandTitle = Command
export const CommandDescription = Command
export const CommandLabel = Command
export const CommandItem = Command
export const CommandSeparator = Command
export const CommandGroup = Command
export const CommandValue = Command
export const CommandList = Command
export const CommandPanel = Command
export const CommandPortal = Command
export const CommandOverlay = Command
export const CommandAction = Command
export const CommandCancel = Command
export const CommandInput = Command
export const CommandEmpty = Command
export const CommandCheckboxItem = Command

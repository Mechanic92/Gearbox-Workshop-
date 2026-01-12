import * as React from "react"
import { cn } from "@/lib/utils"

export const Sonner = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Sonner.displayName = "Sonner"

export const SonnerTrigger = Sonner
export const SonnerContent = Sonner
export const SonnerHeader = Sonner
export const SonnerFooter = Sonner
export const SonnerTitle = Sonner
export const SonnerDescription = Sonner
export const SonnerLabel = Sonner
export const SonnerItem = Sonner
export const SonnerSeparator = Sonner
export const SonnerGroup = Sonner
export const SonnerValue = Sonner
export const SonnerList = Sonner
export const SonnerPanel = Sonner
export const SonnerPortal = Sonner
export const SonnerOverlay = Sonner
export const SonnerAction = Sonner
export const SonnerCancel = Sonner
export const SonnerInput = Sonner
export const SonnerEmpty = Sonner
export const SonnerCheckboxItem = Sonner
export const Toaster = () => null

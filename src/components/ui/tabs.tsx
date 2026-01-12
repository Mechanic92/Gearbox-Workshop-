import * as React from "react"
import { cn } from "@/lib/utils"

export const Tabs = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Tabs.displayName = "Tabs"

export const TabsTrigger = Tabs
export const TabsContent = Tabs
export const TabsHeader = Tabs
export const TabsFooter = Tabs
export const TabsTitle = Tabs
export const TabsDescription = Tabs
export const TabsLabel = Tabs
export const TabsItem = Tabs
export const TabsSeparator = Tabs
export const TabsGroup = Tabs
export const TabsValue = Tabs
export const TabsList = Tabs
export const TabsPanel = Tabs
export const TabsPortal = Tabs
export const TabsOverlay = Tabs
export const TabsAction = Tabs
export const TabsCancel = Tabs
export const TabsInput = Tabs
export const TabsEmpty = Tabs
export const TabsCheckboxItem = Tabs

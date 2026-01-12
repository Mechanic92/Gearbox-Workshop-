import * as React from "react"
import { cn } from "@/lib/utils"

export const DropdownMenu = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
DropdownMenu.displayName = "DropdownMenu"

export const DropdownMenuTrigger = DropdownMenu
export const DropdownMenuContent = DropdownMenu
export const DropdownMenuHeader = DropdownMenu
export const DropdownMenuFooter = DropdownMenu
export const DropdownMenuTitle = DropdownMenu
export const DropdownMenuDescription = DropdownMenu
export const DropdownMenuLabel = DropdownMenu
export const DropdownMenuItem = DropdownMenu
export const DropdownMenuSeparator = DropdownMenu
export const DropdownMenuGroup = DropdownMenu
export const DropdownMenuValue = DropdownMenu
export const DropdownMenuList = DropdownMenu
export const DropdownMenuPanel = DropdownMenu
export const DropdownMenuPortal = DropdownMenu
export const DropdownMenuOverlay = DropdownMenu
export const DropdownMenuAction = DropdownMenu
export const DropdownMenuCancel = DropdownMenu
export const DropdownMenuInput = DropdownMenu
export const DropdownMenuEmpty = DropdownMenu
export const DropdownMenuCheckboxItem = DropdownMenu

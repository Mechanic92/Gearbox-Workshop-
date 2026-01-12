import * as React from "react"
import { cn } from "@/lib/utils"

export const Avatar = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Avatar.displayName = "Avatar"

export const AvatarTrigger = Avatar
export const AvatarContent = Avatar
export const AvatarHeader = Avatar
export const AvatarFooter = Avatar
export const AvatarTitle = Avatar
export const AvatarDescription = Avatar
export const AvatarLabel = Avatar
export const AvatarItem = Avatar
export const AvatarSeparator = Avatar
export const AvatarGroup = Avatar
export const AvatarValue = Avatar
export const AvatarList = Avatar
export const AvatarPanel = Avatar
export const AvatarPortal = Avatar
export const AvatarOverlay = Avatar
export const AvatarAction = Avatar
export const AvatarCancel = Avatar
export const AvatarInput = Avatar
export const AvatarEmpty = Avatar
export const AvatarCheckboxItem = Avatar
export const AvatarImage = Avatar
export const AvatarFallback = Avatar

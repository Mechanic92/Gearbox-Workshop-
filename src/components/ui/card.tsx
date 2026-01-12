import * as React from "react"
import { cn } from "@/lib/utils"

export const Card = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props}>
    {children}
  </div>
))
Card.displayName = "Card"

export const CardTrigger = Card
export const CardContent = Card
export const CardHeader = Card
export const CardFooter = Card
export const CardTitle = Card
export const CardDescription = Card
export const CardLabel = Card
export const CardItem = Card
export const CardSeparator = Card
export const CardGroup = Card
export const CardValue = Card
export const CardList = Card
export const CardPanel = Card
export const CardPortal = Card
export const CardOverlay = Card
export const CardAction = Card
export const CardCancel = Card
export const CardInput = Card
export const CardEmpty = Card
export const CardCheckboxItem = Card

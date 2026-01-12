import * as React from "react"
import { cn } from "@/lib/utils"

export const Calendar = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Calendar.displayName = "Calendar"

export const CalendarTrigger = Calendar
export const CalendarContent = Calendar
export const CalendarHeader = Calendar
export const CalendarFooter = Calendar
export const CalendarTitle = Calendar
export const CalendarDescription = Calendar
export const CalendarLabel = Calendar
export const CalendarItem = Calendar
export const CalendarSeparator = Calendar
export const CalendarGroup = Calendar
export const CalendarValue = Calendar
export const CalendarList = Calendar
export const CalendarPanel = Calendar
export const CalendarPortal = Calendar
export const CalendarOverlay = Calendar
export const CalendarAction = Calendar
export const CalendarCancel = Calendar
export const CalendarInput = Calendar
export const CalendarEmpty = Calendar
export const CalendarCheckboxItem = Calendar

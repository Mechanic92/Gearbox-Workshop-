import * as React from "react"
import { cn } from "@/lib/utils"

export const Accordion = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Accordion.displayName = "Accordion"

export const AccordionTrigger = Accordion
export const AccordionContent = Accordion
export const AccordionHeader = Accordion
export const AccordionFooter = Accordion
export const AccordionTitle = Accordion
export const AccordionDescription = Accordion
export const AccordionLabel = Accordion
export const AccordionItem = Accordion
export const AccordionSeparator = Accordion
export const AccordionGroup = Accordion
export const AccordionValue = Accordion
export const AccordionList = Accordion
export const AccordionPanel = Accordion
export const AccordionPortal = Accordion
export const AccordionOverlay = Accordion
export const AccordionAction = Accordion
export const AccordionCancel = Accordion
export const AccordionInput = Accordion
export const AccordionEmpty = Accordion
export const AccordionCheckboxItem = Accordion

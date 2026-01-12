import * as React from "react"
import { cn } from "@/lib/utils"

export const Form = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Form.displayName = "Form"

export const FormTrigger = Form
export const FormContent = Form
export const FormHeader = Form
export const FormFooter = Form
export const FormTitle = Form
export const FormDescription = Form
export const FormLabel = Form
export const FormItem = Form
export const FormSeparator = Form
export const FormGroup = Form
export const FormValue = Form
export const FormList = Form
export const FormPanel = Form
export const FormPortal = Form
export const FormOverlay = Form
export const FormAction = Form
export const FormCancel = Form
export const FormInput = Form
export const FormEmpty = Form
export const FormCheckboxItem = Form
export const FormControl = Form
export const FormMessage = Form

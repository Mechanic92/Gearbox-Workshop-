import * as React from "react"
import { cn } from "@/lib/utils"

export const Table = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {children}
  </div>
))
Table.displayName = "Table"

export const TableTrigger = Table
export const TableContent = Table
export const TableHeader = Table
export const TableFooter = Table
export const TableTitle = Table
export const TableDescription = Table
export const TableLabel = Table
export const TableItem = Table
export const TableSeparator = Table
export const TableGroup = Table
export const TableValue = Table
export const TableList = Table
export const TablePanel = Table
export const TablePortal = Table
export const TableOverlay = Table
export const TableAction = Table
export const TableCancel = Table
export const TableInput = Table
export const TableEmpty = Table
export const TableCheckboxItem = Table
export const TableBody = Table
export const TableHead = Table
export const TableRow = Table
export const TableCell = Table
export const TableCaption = Table

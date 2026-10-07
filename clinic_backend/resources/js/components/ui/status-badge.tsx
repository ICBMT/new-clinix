import * as React from "react"
import { Badge, type BadgeProps } from "./badge"
import { cn } from "@/lib/utils"

export interface StatusBadgeProps extends BadgeProps {
  /**
   * Disable hover effects for status badges
   * @default true
   */
  disableHover?: boolean
}

function StatusBadge({ 
  className, 
  disableHover = true, 
  ...props 
}: StatusBadgeProps) {
  return (
    <Badge 
      className={cn(
        disableHover && "hover:bg-inherit hover:text-inherit",
        className
      )} 
      {...props} 
    />
  )
}

export { StatusBadge }

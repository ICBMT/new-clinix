import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  // Check document direction for RTL - use multiple methods for better detection
  const isRTL = React.useMemo(() => {
    if (typeof document === 'undefined') return false;
    
    // Check if documentElement exists
    if (!document.documentElement) return false;
    
    // Check dir attribute on html element
    const htmlDir = document.documentElement.dir;
    if (htmlDir === 'rtl') return true;
    
    // Check if html element has rtl class
    if (document.documentElement.classList) {
    const hasRtlClass = document.documentElement.classList.contains('rtl');
    if (hasRtlClass) return true;
    }
    
    // Check computed style direction
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      try {
    const computedStyle = window.getComputedStyle(document.documentElement);
    return computedStyle.direction === 'rtl';
      } catch (e) {
        // Fallback if getComputedStyle fails
        return false;
      }
    }
    
    return false;
  }, []);
  
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        isRTL && "flex-row-reverse",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  // Check document direction for RTL - use multiple methods for better detection
  const isRTL = React.useMemo(() => {
    if (typeof document === 'undefined') return false;
    
    // Check if documentElement exists
    if (!document.documentElement) return false;
    
    // Check dir attribute on html element
    const htmlDir = document.documentElement.dir;
    if (htmlDir === 'rtl') return true;
    
    // Check if html element has rtl class
    if (document.documentElement.classList) {
    const hasRtlClass = document.documentElement.classList.contains('rtl');
    if (hasRtlClass) return true;
    }
    
    // Check computed style direction
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      try {
    const computedStyle = window.getComputedStyle(document.documentElement);
    return computedStyle.direction === 'rtl';
      } catch (e) {
        // Fallback if getComputedStyle fails
        return false;
      }
    }
    
    return false;
  }, []);
  
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", isRTL && "[&>svg]:rotate-180", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

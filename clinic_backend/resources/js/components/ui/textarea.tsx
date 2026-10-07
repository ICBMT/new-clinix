import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, dir, ...props }, ref) => {
    // Auto-detect RTL from document if not explicitly provided
    const isRTL = dir === 'rtl' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
    const textareaDir = dir || (isRTL ? 'rtl' : 'ltr');
    
    return (
      <textarea
        dir={textareaDir}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isRTL && "text-right",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
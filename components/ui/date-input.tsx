"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type DateInputProps = Omit<React.ComponentProps<"input">, "type">

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null)

    const setInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const handleOpenPicker = () => {
      const el = innerRef.current
      if (!el || disabled) return
      if (typeof el.showPicker === "function") {
        try {
          el.showPicker()
        } catch {
          el.focus()
        }
      } else {
        el.focus()
      }
    }

    return (
      <div className="relative">
        <Input
          ref={setInputRef}
          type="date"
          disabled={disabled}
          className={cn("pr-10 date-input-custom-indicator", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={handleOpenPicker}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground hover:text-primary disabled:pointer-events-none disabled:opacity-50"
          aria-label={props["aria-label"] ? `Open calendar: ${props["aria-label"]}` : "Open calendar"}
        >
          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
    )
  }
)
DateInput.displayName = "DateInput"

export { DateInput }

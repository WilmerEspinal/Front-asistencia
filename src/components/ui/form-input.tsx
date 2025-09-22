import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Label } from "./label"

interface FormInputProps extends React.ComponentProps<"input"> {
  label: string
  error?: string
}

function FormInput({ className, label, error, id, ...props }: FormInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={inputId}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive/20",
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormInput }

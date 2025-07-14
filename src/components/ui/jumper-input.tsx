import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const jumperInputVariants = cva(
  "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      error: {
        true: "border-destructive bg-destructive/5 focus-visible:ring-destructive",
        false: "border-input bg-background focus-visible:ring-jumper-orange",
      },
    },
    defaultVariants: {
      error: false,
    },
  }
)

export interface JumperInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: boolean | string
  onChange?: (value: string) => void
}

const JumperInput = React.forwardRef<HTMLInputElement, JumperInputProps>(
  ({ className, type, label, error, onChange, ...props }, ref) => {
    const hasError = Boolean(error)
    const errorMessage = typeof error === 'string' ? error : undefined

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            jumperInputVariants({ error: hasError }),
            // Focus styles with Jumper orange
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            // Border color on focus
            !hasError && "focus-visible:border-jumper-orange",
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>
    )
  }
)
JumperInput.displayName = "JumperInput"

export { JumperInput, jumperInputVariants }
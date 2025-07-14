import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const jumperLogoVariants = cva(
  "flex items-center gap-2",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      variant: {
        light: "",
        dark: "",
        auto: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "auto",
    },
  }
)

const logoSymbolVariants = cva(
  "relative flex items-center justify-center font-bold transition-all duration-300",
  {
    variants: {
      size: {
        sm: "w-6 h-6 text-sm",
        md: "w-8 h-8 text-base",
        lg: "w-10 h-10 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const logoTextVariants = cva(
  "font-semibold tracking-tight transition-colors duration-300",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      variant: {
        light: "text-foreground",
        dark: "text-foreground", 
        auto: "text-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "auto",
    },
  }
)

export interface JumperLogoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof jumperLogoVariants> {
  showText?: boolean
}

const JumperLogo = React.forwardRef<HTMLDivElement, JumperLogoProps>(
  ({ className, size, variant, showText = true, ...props }, ref) => {
    return (
      <div
        className={cn(jumperLogoVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      >
        {/* Símbolo X com gradiente orgânico */}
        <div className={cn(logoSymbolVariants({ size }))}>
          <div 
            className="absolute inset-0 rounded-md"
            style={{
              background: 'var(--gradient-jumper-1)',
              opacity: 0.9,
            }}
          />
          <span 
            className="relative z-10 text-white font-bold select-none"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            ✕
          </span>
        </div>

        {/* Texto "Jumper Studio" */}
        {showText && (
          <span className={cn(logoTextVariants({ size, variant }))}>
            Jumper Studio
          </span>
        )}
      </div>
    )
  }
)
JumperLogo.displayName = "JumperLogo"

export { JumperLogo, jumperLogoVariants }
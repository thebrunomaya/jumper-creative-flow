import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const jumperBackgroundVariants = cva(
  "relative min-h-screen w-full overflow-hidden",
  {
    variants: {
      variant: {
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: "",
      },
    },
    defaultVariants: {
      variant: 1,
    },
  }
)

const getGradientStyle = (variant: number) => {
  const gradientMap = {
    1: 'var(--gradient-jumper-1)',
    2: 'var(--gradient-jumper-2)',
    3: 'var(--gradient-jumper-3)',
    4: 'var(--gradient-jumper-4)',
    5: 'var(--gradient-jumper-5)',
    6: 'var(--gradient-jumper-6)',
    7: 'var(--gradient-jumper-7)',
  }
  
  return {
    background: gradientMap[variant as keyof typeof gradientMap] || gradientMap[1],
  }
}

export interface JumperBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof jumperBackgroundVariants> {
  variant?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  overlay?: boolean
}

const JumperBackground = React.forwardRef<HTMLDivElement, JumperBackgroundProps>(
  ({ className, variant = 1, overlay = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(jumperBackgroundVariants({ variant }), className)}
        style={getGradientStyle(variant)}
        {...props}
      >
        {/* Overlay escuro para contraste */}
        {overlay && (
          <div 
            className="absolute inset-0 z-0"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
            }}
          />
        )}
        
        {/* Conteúdo */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
    )
  }
)
JumperBackground.displayName = "JumperBackground"

export { JumperBackground, jumperBackgroundVariants }
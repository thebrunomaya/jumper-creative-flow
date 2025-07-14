import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Import official Jumper Studio assets
import xWhite from "@/assets/x-white.png"
import xBlack from "@/assets/x-black.png"
import jumperWhite from "@/assets/jumper-white.png"
import jumperBlack from "@/assets/jumper-black.png"

const jumperLogoVariants = cva(
  "flex items-center gap-2",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      theme: {
        light: "",
        dark: "",
        auto: "",
      },
    },
    defaultVariants: {
      size: "md",
      theme: "auto",
    },
  }
)

const logoSymbolVariants = cva(
  "object-contain",
  {
    variants: {
      size: {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const logoTextVariants = cva(
  "object-contain h-auto",
  {
    variants: {
      size: {
        sm: "h-4",
        md: "h-5",
        lg: "h-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface JumperLogoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof jumperLogoVariants> {
  showText?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

const JumperLogo = React.forwardRef<HTMLDivElement, JumperLogoProps>(
  ({ className, size, theme = 'auto', showText = true, ...props }, ref) => {
    
    // Determine which theme to use
    const getEffectiveTheme = () => {
      if (theme === 'auto') {
        // Check if dark mode is active
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      }
      return theme
    }

    const effectiveTheme = getEffectiveTheme()
    
    // Select correct assets based on theme
    const symbolSrc = effectiveTheme === 'dark' ? xWhite : xBlack
    const textSrc = effectiveTheme === 'dark' ? jumperWhite : jumperBlack

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Fallback: hide image and show text
      e.currentTarget.style.display = 'none'
    }

    return (
      <div
        className={cn(jumperLogoVariants({ size, theme, className }))}
        ref={ref}
        {...props}
      >
        {/* Official X Symbol */}
        <img 
          src={symbolSrc}
          alt="Jumper Studio"
          className={cn(logoSymbolVariants({ size }))}
          onError={handleImageError}
          loading="lazy"
        />

        {/* Official Jumper Typography */}
        {showText && (
          <img
            src={textSrc}
            alt="Jumper Studio"
            className={cn(logoTextVariants({ size }))}
            onError={(e) => {
              // Fallback to text if image fails
              const parent = e.currentTarget.parentElement
              if (parent) {
                e.currentTarget.style.display = 'none'
                const fallbackText = document.createElement('span')
                fallbackText.textContent = 'Jumper Studio'
                fallbackText.className = 'font-semibold tracking-tight text-foreground'
                parent.appendChild(fallbackText)
              }
            }}
            loading="lazy"
          />
        )}
      </div>
    )
  }
)
JumperLogo.displayName = "JumperLogo"

export { JumperLogo, jumperLogoVariants }
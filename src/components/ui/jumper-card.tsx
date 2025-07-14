import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const jumperCardVariants = cva(
  "rounded-lg border transition-all duration-200",
  {
    variants: {
      selected: {
        true: "border-jumper-orange border-2 shadow-md",
        false: "border-border hover:border-border/80 hover:shadow-sm",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
)

export interface JumperCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof jumperCardVariants> {
  selected?: boolean
}

const JumperCard = React.forwardRef<HTMLDivElement, JumperCardProps>(
  ({ className, selected, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          jumperCardVariants({ selected }),
          // Background colors - solid only
          "bg-card",
          // Hover effects with solid colors
          "hover:bg-card/95",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
JumperCard.displayName = "JumperCard"

const JumperCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
JumperCardHeader.displayName = "JumperCardHeader"

const JumperCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-card-foreground",
      className
    )}
    {...props}
  />
))
JumperCardTitle.displayName = "JumperCardTitle"

const JumperCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
JumperCardDescription.displayName = "JumperCardDescription"

const JumperCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
JumperCardContent.displayName = "JumperCardContent"

const JumperCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
JumperCardFooter.displayName = "JumperCardFooter"

export { 
  JumperCard, 
  JumperCardHeader, 
  JumperCardFooter, 
  JumperCardTitle, 
  JumperCardDescription, 
  JumperCardContent 
}
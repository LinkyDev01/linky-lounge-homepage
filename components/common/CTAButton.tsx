import { forwardRef } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CTAVariant = "sage" | "mint" | "outline-sage" | "outline-mint"

interface CTAButtonProps extends Omit<ButtonProps, "variant"> {
  ctaVariant?: CTAVariant
}

const ctaStyles: Record<CTAVariant, string> = {
  sage: "bg-sage hover:bg-sage-hover text-white",
  mint: "bg-mint hover:bg-mint-hover text-white",
  "outline-sage":
    "border-sage text-sage hover:bg-sage hover:text-white bg-transparent",
  "outline-mint":
    "border-mint text-mint hover:bg-mint hover:text-white bg-transparent",
}

export const CTAButton = forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ ctaVariant = "sage", className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "transition-transform hover:scale-105",
          ctaStyles[ctaVariant],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

CTAButton.displayName = "CTAButton"

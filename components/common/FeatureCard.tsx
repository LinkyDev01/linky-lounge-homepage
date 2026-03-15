import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import type { BrandColor } from "@/types"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  accentColor?: BrandColor
  className?: string
}

const colorStyles: Record<BrandColor, { bg: string; icon: string }> = {
  sage: {
    bg: "bg-sage-light",
    icon: "text-sage",
  },
  mint: {
    bg: "bg-mint-light",
    icon: "text-mint",
  },
  rose: {
    bg: "bg-rose-light",
    icon: "text-rose",
  },
  mustard: {
    bg: "bg-mustard-light",
    icon: "text-mustard",
  },
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  accentColor = "sage",
  className,
}: FeatureCardProps) {
  const colors = colorStyles[accentColor]

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-6 border border-border",
        "hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group",
        className
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
          "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
          colors.bg
        )}
      >
        <Icon className={cn("w-6 h-6", colors.icon)} />
      </div>
      <h3 className="font-semibold text-lg mb-2 break-keep">{title}</h3>
      <p className="text-muted-foreground text-sm break-keep">{description}</p>
    </div>
  )
}

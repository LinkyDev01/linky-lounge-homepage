import { cn } from "@/lib/utils"
import type { BrandColor } from "@/types"

interface StatCardProps {
  value: string
  label: string
  accentColor?: BrandColor
  className?: string
}

const colorClasses: Record<BrandColor, string> = {
  sage: "text-sage",
  mint: "text-mint",
  rose: "text-rose",
  mustard: "text-mustard",
}

export function StatCard({
  value,
  label,
  accentColor = "mint",
  className,
}: StatCardProps) {
  return (
    <div className={cn("group cursor-default", className)}>
      <p
        className={cn(
          "text-3xl font-bold transition-transform group-hover:scale-110",
          colorClasses[accentColor]
        )}
      >
        {value}
      </p>
      <p className="text-sm text-muted-foreground break-keep">{label}</p>
    </div>
  )
}

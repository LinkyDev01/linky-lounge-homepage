import { cn } from "@/lib/utils"
import type { BrandColor } from "@/types"

interface SectionHeaderProps {
  label: string
  title: string
  description?: string
  labelColor?: BrandColor
  align?: "left" | "center"
  titleColor?: "default" | "white"
  className?: string
}

const colorClasses: Record<BrandColor, string> = {
  sage: "text-sage",
  mint: "text-mint",
  rose: "text-rose",
  mustard: "text-mustard",
}

export function SectionHeader({
  label,
  title,
  description,
  labelColor = "rose",
  align = "center",
  titleColor = "default",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-16", align === "center" && "text-center", className)}>
      <p
        className={cn(
          "font-medium mb-4",
          titleColor === "white" ? "text-white/80" : colorClasses[labelColor]
        )}
      >
        {label}
      </p>
      <h2
        className={cn(
          "text-3xl sm:text-4xl font-bold text-balance break-keep",
          titleColor === "white" && "text-white"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 break-keep",
            titleColor === "white" ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}

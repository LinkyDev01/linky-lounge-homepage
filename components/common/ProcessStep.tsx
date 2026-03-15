import { cn } from "@/lib/utils"

interface ProcessStepProps {
  step: string
  title: string
  description: string
  variant?: "default" | "white"
  className?: string
}

export function ProcessStep({
  step,
  title,
  description,
  variant = "default",
  className,
}: ProcessStepProps) {
  const isWhite = variant === "white"

  return (
    <div className={cn("text-center group cursor-default", className)}>
      <div
        className={cn(
          "text-6xl font-bold mb-4 transition-all duration-300 group-hover:scale-110",
          isWhite
            ? "text-white"
            : "text-muted-foreground/20 group-hover:text-muted-foreground/40"
        )}
      >
        {step}
      </div>
      <h3
        className={cn(
          "font-semibold text-lg mb-2 break-keep",
          isWhite ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm break-keep",
          isWhite ? "text-white/70" : "text-muted-foreground"
        )}
      >
        {description}
      </p>
    </div>
  )
}

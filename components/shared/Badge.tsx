import { cn } from "@/utils/classNames";

type BadgeVariant = "buy" | "sell" | "closed" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  buy: "border border-success/30 bg-success/10 text-success",
  sell: "border border-destructive/30 bg-destructive/10 text-destructive",
  closed: "border border-destructive/25 bg-destructive/10 text-destructive",
  default: "border border-primary/25 bg-primary/10 text-primary",
};

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "px-3 py-1 rounded text-xs font-bold",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

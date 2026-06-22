import { cn } from "@/utils/classNames";
import { CARD_STYLES } from "@/constants/ui";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  hover?: boolean;
}

export default function Card({
  children,
  className,
  hover = false,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        CARD_STYLES,
        hover && "hover:bg-white/10 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}

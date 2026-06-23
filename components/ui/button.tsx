import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/utils/classNames";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
				secondary:
					"border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
				outline:
					"border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
				ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
				destructive:
					"border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
				success:
					"border border-success/30 bg-success/10 text-success hover:bg-success/15",
			},
			size: {
				sm: "h-8 px-3",
				md: "h-10 px-4",
				lg: "h-11 px-5",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			loading = false,
			children,
			disabled,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : "button";

		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				disabled={disabled || loading}
				{...props}
			>
				{loading && <Loader2 className="h-4 w-4 animate-spin" />}
				{children}
			</Comp>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };

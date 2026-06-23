import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/classNames";

const alertVariants = cva("rounded-lg border p-4 text-sm", {
	variants: {
		variant: {
			default: "border-border bg-card text-card-foreground",
			info: "border-primary/25 bg-primary/10 text-primary",
			success: "border-success/25 bg-success/10 text-success",
			warning: "border-warning/30 bg-warning/10 text-warning",
			destructive: "border-destructive/25 bg-destructive/10 text-destructive",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

interface AlertProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof alertVariants> {}

function Alert({ className, variant, ...props }: AlertProps) {
	return (
		<div
			role="alert"
			className={cn(alertVariants({ variant, className }))}
			{...props}
		/>
	);
}

export { Alert };

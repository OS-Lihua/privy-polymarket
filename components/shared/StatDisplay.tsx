import { cn } from "@/utils/classNames";

interface StatDisplayProps {
	label: string;
	value: string | number;
	highlight?: boolean;
	highlightColor?: "green" | "red";
}

export default function StatDisplay({
	label,
	value,
	highlight = false,
	highlightColor = "green",
}: StatDisplayProps) {
	return (
		<div>
			<p className="text-muted-foreground text-xs mb-1">{label}</p>
			<p
				className={cn(
					"font-medium",
					highlight && highlightColor === "green" && "text-success",
					highlight && highlightColor === "red" && "text-destructive",
				)}
			>
				{value}
			</p>
		</div>
	);
}

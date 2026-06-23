"use client";

import { CATEGORIES, type CategoryId } from "@/constants/categories";
import { cn } from "@/utils/classNames";
import { useI18n } from "@/lib/i18n";

interface CategoryTabsProps {
	activeCategory: CategoryId;
	onCategoryChange: (categoryId: CategoryId) => void;
}

export default function CategoryTabs({
	activeCategory,
	onCategoryChange,
}: CategoryTabsProps) {
	const { t } = useI18n();

	return (
		<div className="flex gap-2 flex-wrap mb-4">
			{CATEGORIES.map((category) => (
				<button
					key={category.id}
					onClick={() => onCategoryChange(category.id)}
					className={cn(
						"rounded-md border px-3 py-2 text-sm font-medium transition-colors",
						activeCategory === category.id
							? "border-primary/30 bg-primary text-primary-foreground"
							: "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
					)}
				>
					{t(category.id)}
				</button>
			))}
		</div>
	);
}

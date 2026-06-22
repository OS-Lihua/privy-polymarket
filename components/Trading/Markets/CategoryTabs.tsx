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
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeCategory === category.id
              ? "bg-blue-600 text-white"
              : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          )}
        >
          {t(category.id)}
        </button>
      ))}
    </div>
  );
}

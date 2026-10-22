export const CATEGORY_VARIANTS = ["A", "A1", "A2", "AM", "B", "B1", "C", "C1", "D", "D1", "T", "PT"] as const;

export type CategoryVariant = typeof CATEGORY_VARIANTS[number];

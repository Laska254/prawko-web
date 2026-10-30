import type {CategoryVariant} from "./CategoryVariant.tsx";

export interface CategoryStatsDto {
    readonly category: CategoryVariant;
    readonly examsTaken: number;
    readonly examsPassed: number;
    readonly averageScore: number;
    readonly bestScore: number;
}

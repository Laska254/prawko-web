import type {CategoryStatsDto} from "./CategoryStatsDto.tsx";

// Only finished exams count. Without any, the scores are null and `categories` is empty.
export interface UserStatsDto {
    readonly examsTaken: number;
    readonly examsPassed: number;
    readonly averageScore: number | null;
    readonly bestScore: number | null;
    readonly categories: readonly CategoryStatsDto[];
}

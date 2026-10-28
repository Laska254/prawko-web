import type {CategoryVariant} from "./CategoryVariant.tsx";

export interface ExamSummaryDto {
    readonly id: number;
    readonly category: CategoryVariant;
    readonly created: Date;
    readonly updated: Date;
    readonly expires: Date;
    readonly score: number;
    readonly active: boolean;
}

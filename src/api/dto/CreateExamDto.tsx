import type {CategoryVariant} from "./CategoryVariant.tsx";

export interface CreateExamDto {
    readonly userId: number;
    readonly categoryName: CategoryVariant;
}

import type {AnswerDto} from "./AnswerDto.tsx";
import type {CategoryVariant} from "./CategoryVariant.tsx";
import type {QuestionDto} from "./QuestionDto.tsx";

export interface ExamDto {
    readonly id: number;
    readonly userId: number;
    readonly category: CategoryVariant;
    readonly created: Date;
    readonly updated: Date;
    readonly expires: Date;
    readonly questions: readonly QuestionDto[];
    readonly userAnswers: readonly AnswerDto[];
    readonly score: number;
    readonly active: boolean;
}

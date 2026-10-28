import type {AnswerDto} from "./AnswerDto.tsx";
import type {CategoryVariant} from "./CategoryVariant.tsx";
import type {QuestionTranslationDto} from "./QuestionTranslationDto.tsx";
import type {QuestionType} from "./QuestionType.tsx";

export interface QuestionDto {
    readonly id: number;
    readonly name: string;
    readonly answers: readonly AnswerDto[];
    // Filename, served from `/media/{media}`.
    readonly media: string;
    readonly type: QuestionType;
    readonly value: number;
    readonly categories: readonly CategoryVariant[];
    readonly translations: readonly QuestionTranslationDto[];
}

import type {AnswerTranslationDto} from "./AnswerTranslationDto.tsx";

export interface AnswerDto {
    readonly id: number;
    readonly questionId: number;
    // Missing while it must stay hidden, e.g. during an active exam.
    readonly correct?: boolean;
    readonly translations: readonly AnswerTranslationDto[];
}

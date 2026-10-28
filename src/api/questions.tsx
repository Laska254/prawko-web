import {api} from "./client.tsx";
import type {CategoryVariant} from "./dto/CategoryVariant.tsx";
import type {PagedModel} from "./dto/PagedModel.tsx";
import type {QuestionDto} from "./dto/QuestionDto.tsx";
import type {QuestionType} from "./dto/QuestionType.tsx";

// A missing category or type is picked at random by the server.
export async function getRandomQuestion(category?: CategoryVariant, type?: QuestionType): Promise<QuestionDto> {
    return (await api.get<QuestionDto>("/questions/random", {params: {category, type}})).data;
}

// Admin only, `page` is zero-based.
export async function getQuestions(page: number): Promise<PagedModel<QuestionDto>> {
    return (await api.get<PagedModel<QuestionDto>>("/questions", {params: {page}})).data;
}

export async function getQuestion(id: number): Promise<QuestionDto> {
    return (await api.get<QuestionDto>(`/questions/${id}`)).data;
}

// Admin only: adds the questions of a CSV file.
export async function uploadQuestions(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    await api.postForm("/questions", formData);
}

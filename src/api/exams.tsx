import {api, createdId} from "./client.tsx";
import type {CreateExamDto} from "./dto/CreateExamDto.tsx";
import type {ExamDto} from "./dto/ExamDto.tsx";
import type {ExamSummaryDto} from "./dto/ExamSummaryDto.tsx";
import type {PagedModel} from "./dto/PagedModel.tsx";
import type {SubmitAnswerDto} from "./dto/SubmitAnswerDto.tsx";

// Returns the new exam's ID.
export async function createExam(createExamDto: CreateExamDto): Promise<number> {
    return createdId(await api.post("/exams", createExamDto));
}

export async function getExam(id: number): Promise<ExamDto> {
    return (await api.get<ExamDto>(`/exams/${id}`)).data;
}

// Newest first, `page` is zero-based; without `size` the server's default is used.
export async function getExams(userId: number, page: number, size?: number): Promise<PagedModel<ExamSummaryDto>> {
    return (await api.get<PagedModel<ExamSummaryDto>>("/exams", {params: {userId, page, size}})).data;
}

// Replaces an earlier answer to the same question.
export async function submitAnswer(examId: number, submitAnswerDto: SubmitAnswerDto): Promise<void> {
    await api.post(`/exams/${examId}/answers`, submitAnswerDto);
}

// Returns the finished exam with the correct answers revealed.
export async function finishExam(id: number): Promise<ExamDto> {
    return (await api.post<ExamDto>(`/exams/${id}/finish`)).data;
}

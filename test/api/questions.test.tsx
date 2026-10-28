import {http, HttpResponse} from "msw/http";
import {apiUrl, mockRequest, server} from "@test/support/server.tsx";
import type {QuestionDto} from "@/api/dto/QuestionDto.tsx";
import {getQuestion, getQuestions, getRandomQuestion, uploadQuestions} from "@/api/questions.tsx";

describe("questions", () => {
    const question: QuestionDto = {
        id: 4,
        name: "Q1",
        answers: [{id: 7, questionId: 4, correct: true, translations: [{content: "Tak", languageCode: "pl"}]}],
        media: "q1.jpg",
        type: "BASIC",
        value: 3,
        categories: ["B"],
        translations: [{content: "Czy wolno?", languageCode: "pl"}],
    };

    it.each([
        [undefined, undefined, ""],
        ["B" as const, undefined, "?category=B"],
        [undefined, "SPECIAL" as const, "?type=SPECIAL"],
        ["B" as const, "BASIC" as const, "?category=B&type=BASIC"],
    ])("gets a random question of category %s and type %s", async (category, type, search) => {
        const requests = mockRequest("get", "/questions/random", {body: question});

        expect(await getRandomQuestion(category, type)).toEqual(question);
        expect(requests).toEqual([{search, body: undefined}]);
    });

    it("gets a page of questions", async () => {
        const page = {content: [question], page: {size: 20, number: 2, totalElements: 41, totalPages: 3}};
        const requests = mockRequest("get", "/questions", {body: page});

        expect(await getQuestions(2)).toEqual(page);
        expect(requests).toEqual([{search: "?page=2", body: undefined}]);
    });

    it("gets a question by ID", async () => {
        const requests = mockRequest("get", "/questions/4", {body: question});

        expect(await getQuestion(4)).toEqual(question);
        expect(requests).toEqual([{search: "", body: undefined}]);
    });

    it("uploads a CSV file as multipart form data", async () => {
        let contentType: string | null = null;
        let body = "";
        server.use(http.post(apiUrl("/questions"), async ({request}) => {
            contentType = request.headers.get("Content-Type");
            body = await request.text();
            return new HttpResponse(null, {status: 201});
        }));

        await uploadQuestions(new File(["name;content"], "questions.csv", {type: "text/csv"}));

        expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
        expect(body).toContain('Content-Disposition: form-data; name="file"; filename="questions.csv"');
        expect(body).toContain("Content-Type: text/csv");
        expect(body).toContain("name;content");
    });
});

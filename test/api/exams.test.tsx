import {apiUrl, mockRequest} from "@test/support/server.tsx";
import {createExam, finishExam, getExam, getExams, submitAnswer} from "@/api/exams.tsx";

describe("exams", () => {
    const exam = {
        id: 3,
        userId: 1,
        category: "B",
        created: "2026-10-23T12:00:00Z",
        updated: "2026-10-23T12:10:00Z",
        expires: "2026-10-23T12:25:00Z",
        questions: [],
        userAnswers: [],
        score: 0,
        active: true,
    };
    const parsedExam = {
        ...exam,
        created: new Date(Date.UTC(2026, 9, 23, 12, 0)),
        updated: new Date(Date.UTC(2026, 9, 23, 12, 10)),
        expires: new Date(Date.UTC(2026, 9, 23, 12, 25)),
    };

    it("creates an exam and returns its ID from Location", async () => {
        const requests = mockRequest("post", "/exams",
            {status: 201, headers: {Location: apiUrl("/exams/3")}});

        expect(await createExam({userId: 1, categoryName: "B"})).toBe(3);
        expect(requests).toEqual([{search: "", body: {userId: 1, categoryName: "B"}}]);
    });

    it("gets an exam by ID", async () => {
        const requests = mockRequest("get", "/exams/3", {body: exam});

        expect(await getExam(3)).toEqual(parsedExam);
        expect(requests).toEqual([{search: "", body: undefined}]);
    });

    it.each([
        [undefined, "?userId=1&page=2"],
        [5, "?userId=1&page=2&size=5"],
    ])("gets a page of a user's exams with size %s", async (size, search) => {
        const summary = {
            id: 3,
            category: "B",
            created: exam.created,
            updated: exam.updated,
            expires: exam.expires,
            score: 0,
            active: true,
        };
        const page = {content: [summary], page: {size: 20, number: 2, totalElements: 41, totalPages: 3}};
        const requests = mockRequest("get", "/exams", {body: page});

        expect(await getExams(1, 2, size)).toEqual({
            content: [{...summary, created: parsedExam.created, updated: parsedExam.updated, expires: parsedExam.expires}],
            page: page.page,
        });
        expect(requests).toEqual([{search, body: undefined}]);
    });

    it("submits an answer", async () => {
        const requests = mockRequest("post", "/exams/3/answers", {status: 204});

        await expect(submitAnswer(3, {answerId: 7})).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: {answerId: 7}}]);
    });

    it("finishes an exam and returns it", async () => {
        const requests = mockRequest("post", "/exams/3/finish", {body: {...exam, active: false}});

        expect(await finishExam(3)).toEqual({...parsedExam, active: false});
        expect(requests).toEqual([{search: "", body: undefined}]);
    });
});

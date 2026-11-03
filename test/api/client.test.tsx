import {delay} from "msw";
import {http, HttpResponse} from "msw/http";
import {apiUrl, mockRequest, server} from "@test/support/server.tsx";
import {tokens} from "@test/support/data.tsx";
import {getAccessToken, getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import type {ExamSummaryDto} from "@/api/dto/ExamSummaryDto.tsx";
import type {PagedModel} from "@/api/dto/PagedModel.tsx";
import {api, createdId} from "@/api/client.tsx";

describe("client", () => {
    it("parses a paged response with its instants as dates", async () => {
        const page = {size: 20, number: 0, totalElements: 1, totalPages: 1};
        server.use(http.get(apiUrl("/exams"), () => HttpResponse.json({
            content: [{
                id: 1,
                category: "B",
                created: "2026-10-23T12:00:00Z",
                updated: "2026-10-23T12:10:00Z",
                expires: "2026-10-23T12:25:00Z",
                score: 70,
                active: false,
            }],
            page,
        })));

        const response = await api.get<PagedModel<ExamSummaryDto>>("/exams");

        expect(response.data).toEqual({
            content: [{
                id: 1,
                category: "B",
                created: new Date(Date.UTC(2026, 9, 23, 12, 0)),
                updated: new Date(Date.UTC(2026, 9, 23, 12, 10)),
                expires: new Date(Date.UTC(2026, 9, 23, 12, 25)),
                score: 70,
                active: false,
            }],
            page,
        });
    });

    it("gives up on a request after 15 seconds", () => {
        expect(api.defaults.timeout).toBe(15_000);
    });

    it("reports a timeout as ETIMEDOUT", async () => {
        server.use(http.get(apiUrl("/exams"), async () => {
            await delay(100);
            return new HttpResponse(null, {status: 204});
        }));

        await expect(api.get("/exams", {timeout: 10})).rejects.toMatchObject({code: "ETIMEDOUT"});
    });

    describe("createdId", () => {
        it("returns the ID at the end of Location", async () => {
            mockRequest("post", "/users", {status: 201, headers: {Location: apiUrl("/users/5")}});

            expect(createdId(await api.post("/users"))).toBe(5);
        });

        it("throws without Location", async () => {
            mockRequest("post", "/users", {status: 201});
            const response = await api.post("/users");

            expect(() => createdId(response)).toThrow("No created ID in Location: undefined");
        });

        it.each([
            apiUrl("/users/"),
            apiUrl("/users/abc"),
            apiUrl("/users/1.5"),
            apiUrl("/users/0"),
        ])("throws when Location is %s", async location => {
            mockRequest("post", "/users", {status: 201, headers: {Location: location}});
            const response = await api.post("/users");

            expect(() => createdId(response)).toThrow(`No created ID in Location: ${location}`);
        });
    });

    describe("interceptors", () => {
        const assign = vi.fn();

        beforeEach(() => {
            vi.stubGlobal("location", {...window.location, assign});
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            assign.mockReset();
        });

        function respondWith(status: number) {
            let authorization: string | null = null;
            server.use(http.post(apiUrl("/auth/verify"), ({request}) => {
                authorization = request.headers.get("Authorization");
                return new HttpResponse(null, {status});
            }));
            return () => authorization;
        }

        it("sends the access token as a Bearer token", async () => {
            const authorization = respondWith(204);
            saveTokens(tokens);

            await api.post("/auth/verify");

            expect(authorization()).toBe("Bearer access-token");
        });

        it("sends no Authorization header without an access token", async () => {
            const authorization = respondWith(204);

            await api.post("/auth/verify");

            expect(authorization()).toBeNull();
        });

        it("clears the tokens and goes to /auth on 401", async () => {
            respondWith(401);
            saveTokens(tokens);

            await expect(api.post("/auth/verify")).rejects.toMatchObject({response: {status: 401}});
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
            expect(assign).toHaveBeenCalledWith("/auth");
        });

        it("clears the refresh token and goes to /auth on 401 after a reload", async () => {
            const authorization = respondWith(401);
            localStorage.setItem("refreshToken", "refresh-token");

            await expect(api.post("/auth/verify")).rejects.toMatchObject({response: {status: 401}});
            expect(authorization()).toBeNull();
            expect(getRefreshToken()).toBeNull();
            expect(assign).toHaveBeenCalledWith("/auth");
        });

        it("doesn't redirect on 401 without tokens", async () => {
            respondWith(401);

            await expect(api.post("/auth/verify")).rejects.toMatchObject({response: {status: 401}});
            expect(assign).not.toHaveBeenCalled();
        });

        it("keeps the tokens on other errors", async () => {
            respondWith(500);
            saveTokens(tokens);

            await expect(api.post("/auth/verify")).rejects.toMatchObject({response: {status: 500}});
            expect(getAccessToken()).toBe("access-token");
            expect(getRefreshToken()).toBe("refresh-token");
            expect(assign).not.toHaveBeenCalled();
        });
    });
});

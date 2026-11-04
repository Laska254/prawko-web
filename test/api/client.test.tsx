import {delay} from "msw";
import {http, HttpResponse} from "msw/http";
import {apiUrl, mockRequest, server} from "@test/support/server.tsx";
import {tokens} from "@test/support/data.tsx";
import {getAccessToken, getRefreshToken, onSessionEnded, saveTokens} from "@/api/tokens.tsx";
import type {AuthTokensDto} from "@/api/dto/AuthTokensDto.tsx";
import type {RefreshTokenDto} from "@/api/dto/RefreshTokenDto.tsx";
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
        const newTokens: AuthTokensDto = {
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            expiresIn: 900,
        };
        const sessionEnded = vi.fn();
        let stopListening: () => void;

        beforeEach(() => {
            stopListening = onSessionEnded(sessionEnded);
        });

        afterEach(() => {
            stopListening();
            sessionEnded.mockReset();
            // Here, not at a test's end, so a failed assertion doesn't leave `navigator.locks` spied on for later tests.
            vi.restoreAllMocks();
        });

        function respondWith(status: number) {
            let authorization: string | null = null;
            server.use(http.post(apiUrl("/auth/verify"), ({request}) => {
                authorization = request.headers.get("Authorization");
                return new HttpResponse(null, {status});
            }));
            return () => authorization;
        }

        // Answers POST `path` with `401` unless it's sent with the new access token, after waiting for `held`;
        // returns each request's Authorization header.
        function requireNewToken(path: string, held = Promise.resolve()): (string | null)[] {
            const authorizations: (string | null)[] = [];
            server.use(http.post(apiUrl(path), async ({request}) => {
                const authorization = request.headers.get("Authorization");
                authorizations.push(authorization);
                await held;
                if (authorization === "Bearer new-access-token") {
                    return new HttpResponse(null, {status: 204});
                }
                return new HttpResponse(null, {status: 401});
            }));
            return authorizations;
        }

        function mockRefresh() {
            return mockRequest("post", "/auth/refresh", {body: newTokens});
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

        it("refreshes the tokens on 401 and sends the request again", async () => {
            const authorizations = requireNewToken("/auth/verify");
            const refreshes = mockRefresh();
            saveTokens(tokens);

            await expect(api.post("/auth/verify")).resolves.toMatchObject({status: 204});
            expect(refreshes).toEqual([{search: "", body: {refreshToken: "refresh-token"}}]);
            expect(authorizations).toEqual(["Bearer access-token", "Bearer new-access-token"]);
            expect(getAccessToken()).toBe("new-access-token");
            expect(getRefreshToken()).toBe("new-refresh-token");
        });

        it("refreshes the tokens before the first request after a reload", async () => {
            const authorizations = requireNewToken("/auth/verify");
            const refreshes = mockRefresh();
            localStorage.setItem("refreshToken", "refresh-token");

            await expect(api.post("/auth/verify")).resolves.toMatchObject({status: 204});
            expect(refreshes).toEqual([{search: "", body: {refreshToken: "refresh-token"}}]);
            expect(authorizations).toEqual(["Bearer new-access-token"]);
        });

        it("refreshes once for parallel requests after a reload", async () => {
            const authorizations = requireNewToken("/auth/verify");
            const refreshes = mockRefresh();
            localStorage.setItem("refreshToken", "refresh-token");

            await Promise.all([api.post("/auth/verify"), api.post("/auth/verify"), api.post("/auth/verify")]);

            expect(refreshes).toHaveLength(1);
            expect(authorizations).toEqual(Array(3).fill("Bearer new-access-token"));
        });

        it("sends the request without a token when the refresh after a reload ends the session", async () => {
            const authorization = respondWith(204);
            mockRequest("post", "/auth/refresh", {status: 401});
            localStorage.setItem("refreshToken", "refresh-token");

            await expect(api.post("/auth/verify")).resolves.toMatchObject({status: 204});
            expect(authorization()).toBeNull();
            expect(getRefreshToken()).toBeNull();
            expect(sessionEnded).toHaveBeenCalledExactlyOnceWith(true);
        });

        it("fails without sending the request when the refresh after a reload gets no answer", async () => {
            const authorizations = requireNewToken("/auth/verify");
            server.use(http.post(apiUrl("/auth/refresh"), () => HttpResponse.error()));
            localStorage.setItem("refreshToken", "refresh-token");

            await expect(api.post("/auth/verify")).rejects.toMatchObject({code: "ERR_NETWORK"});
            expect(authorizations).toEqual([]);
            expect(getRefreshToken()).toBe("refresh-token");
            expect(sessionEnded).not.toHaveBeenCalled();
        });

        it("refreshes once for parallel 401s", async () => {
            const authorizations = requireNewToken("/auth/verify");
            const refreshes = mockRefresh();
            saveTokens(tokens);

            await Promise.all([api.post("/auth/verify"), api.post("/auth/verify"), api.post("/auth/verify")]);

            expect(refreshes).toHaveLength(1);
            expect(authorizations.toSorted()).toEqual([
                ...Array(3).fill("Bearer access-token"),
                ...Array(3).fill("Bearer new-access-token"),
            ]);
        });

        it("sends a request again without refreshing when another request's refresh got a new token", async () => {
            let respond!: () => void;
            const slowAuthorizations = requireNewToken("/exams", new Promise(resolve => respond = resolve));
            requireNewToken("/auth/verify");
            const refreshes = mockRefresh();
            saveTokens(tokens);
            const slowRequest = api.post("/exams");
            await vi.waitFor(() => expect(slowAuthorizations).toHaveLength(1));

            await api.post("/auth/verify");
            respond();

            await expect(slowRequest).resolves.toMatchObject({status: 204});
            expect(refreshes).toHaveLength(1);
            expect(slowAuthorizations).toEqual(["Bearer access-token", "Bearer new-access-token"]);
        });

        it("expires the session when the refresh token is no longer valid", async () => {
            const authorizations = requireNewToken("/auth/verify");
            mockRequest("post", "/auth/refresh", {status: 401});
            saveTokens(tokens);

            await expect(api.post("/auth/verify")).rejects.toMatchObject({response: {status: 401}});
            expect(authorizations).toHaveLength(1);
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
            expect(sessionEnded).toHaveBeenCalledExactlyOnceWith(true);
        });

        it("keeps the session when the refresh gets no answer", async () => {
            requireNewToken("/auth/verify");
            server.use(http.post(apiUrl("/auth/refresh"), () => HttpResponse.error()));
            saveTokens(tokens);

            await expect(api.post("/auth/verify")).rejects.toMatchObject({code: "ERR_NETWORK"});
            expect(getAccessToken()).toBe("access-token");
            expect(getRefreshToken()).toBe("refresh-token");
            expect(sessionEnded).not.toHaveBeenCalled();
        });

        it("expires the session when the new access token gets a 401 too", async () => {
            const authorization = respondWith(401);
            const refreshes = mockRefresh();
            saveTokens(tokens);

            await expect(api.post("/auth/verify")).rejects.toMatchObject({response: {status: 401}});
            expect(refreshes).toHaveLength(1);
            expect(authorization()).toBe("Bearer new-access-token");
            expect(getRefreshToken()).toBeNull();
            expect(sessionEnded).toHaveBeenCalledExactlyOnceWith(true);
        });

        it("refreshes without Web Locks", async () => {
            vi.spyOn(navigator, "locks", "get").mockReturnValue(undefined as unknown as LockManager);
            requireNewToken("/auth/verify");
            const refreshes = mockRefresh();
            saveTokens(tokens);

            await expect(api.post("/auth/verify")).resolves.toMatchObject({status: 204});
            expect(refreshes).toHaveLength(1);
        });

        describe("in two tabs", () => {
            // Another tab: its own API client and access token in memory, sharing localStorage and the locks.
            async function openOtherTab() {
                vi.resetModules();
                return {...await import("@/api/client.tsx"), ...await import("@/api/tokens.tsx")};
            }

            // Answers `/auth/verify` with `401` for the expired `tokens.accessToken` only.
            function expireAccessToken(): void {
                server.use(http.post(apiUrl("/auth/verify"), ({request}) => {
                    if (request.headers.get("Authorization") === "Bearer access-token") {
                        return new HttpResponse(null, {status: 401});
                    }
                    return new HttpResponse(null, {status: 204});
                }));
            }

            // Answers each refresh token once, as the server does, with a new pair numbered by the refresh; returns the
            // refresh tokens received.
            function mockRotatingRefresh(): string[] {
                const received: string[] = [];
                server.use(http.post(apiUrl("/auth/refresh"), async ({request}) => {
                    const {refreshToken} = await request.json() as RefreshTokenDto;
                    if (received.includes(refreshToken)) {
                        return new HttpResponse(null, {status: 401});
                    }
                    received.push(refreshToken);
                    const number = received.length;
                    return HttpResponse.json({
                        accessToken: `access-token-${number}`,
                        refreshToken: `refresh-token-${number}`,
                        expiresIn: 900,
                    });
                }));
                return received;
            }

            it("refresh one at a time with the refresh token the other stored and both keep the session", async () => {
                saveTokens(tokens);
                const otherTab = await openOtherTab();
                otherTab.saveTokens(tokens);
                expireAccessToken();
                const received = mockRotatingRefresh();

                await Promise.all([api.post("/auth/verify"), otherTab.api.post("/auth/verify")]);

                expect(received).toEqual(["refresh-token", "refresh-token-1"]);
                expect(getRefreshToken()).toBe("refresh-token-2");
                expect([getAccessToken(), otherTab.getAccessToken()].sort())
                    .toEqual(["access-token-1", "access-token-2"]);
                expect(sessionEnded).not.toHaveBeenCalled();
            });

            it("both end the session when the other tab's refresh ended it, and only that tab knows it expired", async () => {
                saveTokens(tokens);
                const otherTab = await openOtherTab();
                otherTab.saveTokens(tokens);
                const otherSessionEnded = vi.fn();
                const stopOtherListening = otherTab.onSessionEnded(otherSessionEnded);
                expireAccessToken();
                const refreshes = mockRequest("post", "/auth/refresh", {status: 401});

                const results = await Promise.allSettled([api.post("/auth/verify"), otherTab.api.post("/auth/verify")]);

                expect(results).toMatchObject([
                    {status: "rejected", reason: {response: {status: 401}}},
                    {status: "rejected", reason: {response: {status: 401}}},
                ]);
                expect(refreshes).toHaveLength(1);
                expect(getAccessToken()).toBeNull();
                expect(otherTab.getAccessToken()).toBeNull();
                expect(sessionEnded).toHaveBeenCalledExactlyOnceWith(true);
                expect(otherSessionEnded).toHaveBeenCalledExactlyOnceWith(false);
                stopOtherListening();
            });
        });

        it("doesn't refresh on 401 without tokens", async () => {
            respondWith(401);
            const refreshes = mockRefresh();

            await expect(api.post("/auth/verify")).rejects.toMatchObject({response: {status: 401}});
            expect(refreshes).toEqual([]);
            expect(sessionEnded).not.toHaveBeenCalled();
        });

        it("keeps the tokens on other errors", async () => {
            respondWith(500);
            const refreshes = mockRefresh();
            saveTokens(tokens);

            await expect(api.post("/auth/verify")).rejects.toMatchObject({response: {status: 500}});
            expect(refreshes).toEqual([]);
            expect(getAccessToken()).toBe("access-token");
            expect(getRefreshToken()).toBe("refresh-token");
        });
    });
});

import {http, HttpResponse} from "msw/http";
import {apiUrl, mockPost, server} from "@test/support/server.tsx";
import {credentials, registerDto} from "@test/support/data.tsx";
import {getCredentials, saveCredentials} from "@/api/credentials.tsx";
import type {ExamSummaryDto} from "@/api/dto/ExamSummaryDto.tsx";
import type {PagedModel} from "@/api/dto/PagedModel.tsx";
import {api, forgotPassword, login, register, resendVerification, resetPassword, verifyEmail} from "@/api/requests.tsx";

describe("requests", () => {
    const verifyEmailDto = {token: "token"};
    const emailDto = {email: "jan@example.com"};
    const resetPasswordDto = {token: "token", newPassword: "secret"};

    it.each([
        ["/users", () => register(registerDto), registerDto],
        ["/auth/verify", () => verifyEmail(verifyEmailDto), verifyEmailDto],
        ["/auth/verify/resend", () => resendVerification(emailDto), emailDto],
        ["/auth/password/forgot", () => forgotPassword(emailDto), emailDto],
        ["/auth/password/reset", () => resetPassword(resetPasswordDto), resetPasswordDto],
    ])("posts the body to %s", async (path, send, body) => {
        const requests = mockPost(path);

        const response = await send();

        expect(response.status).toBe(204);
        expect(requests).toEqual([body]);
    });

    describe("login", () => {
        it("saves the credentials after signing in", async () => {
            const requests = mockPost("/auth");

            await login(credentials);

            expect(requests).toEqual([credentials]);
            expect(getCredentials()).toBe(btoa("jan:secret"));
        });

        it("doesn't send the previous credentials", async () => {
            let authorization: string | null = "";
            server.use(http.post(apiUrl("/auth"), ({request}) => {
                authorization = request.headers.get("Authorization");
                return new HttpResponse(null, {status: 204});
            }));
            saveCredentials({userName: "old", password: "old"});

            await login(credentials);

            expect(authorization).toBeNull();
        });

        it("doesn't save the credentials when signing in fails", async () => {
            mockPost("/auth", 401);
            saveCredentials({userName: "old", password: "old"});

            await expect(login(credentials)).rejects.toMatchObject({response: {status: 401}});
            expect(getCredentials()).toBeNull();
        });
    });

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

        it("sends the stored credentials", async () => {
            const authorization = respondWith(204);
            saveCredentials(credentials);

            await verifyEmail({token: "token"});

            expect(authorization()).toBe(`Basic ${btoa("jan:secret")}`);
        });

        it("sends no Authorization header without credentials", async () => {
            const authorization = respondWith(204);

            await verifyEmail({token: "token"});

            expect(authorization()).toBeNull();
        });

        it("clears the credentials and goes to /auth on 401", async () => {
            respondWith(401);
            saveCredentials(credentials);

            await expect(verifyEmail({token: "token"})).rejects.toMatchObject({response: {status: 401}});
            expect(getCredentials()).toBeNull();
            expect(assign).toHaveBeenCalledWith("/auth");
        });

        it("doesn't redirect on 401 without credentials", async () => {
            respondWith(401);

            await expect(verifyEmail({token: "token"})).rejects.toMatchObject({response: {status: 401}});
            expect(assign).not.toHaveBeenCalled();
        });

        it("keeps the credentials on other errors", async () => {
            respondWith(500);
            saveCredentials(credentials);

            await expect(verifyEmail({token: "token"})).rejects.toMatchObject({response: {status: 500}});
            expect(getCredentials()).toBe(btoa("jan:secret"));
            expect(assign).not.toHaveBeenCalled();
        });
    });
});

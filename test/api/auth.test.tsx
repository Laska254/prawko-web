import {http, HttpResponse} from "msw/http";
import {apiUrl, mockNetworkError, mockPendingRequest, mockPost, mockRequest, server} from "@test/support/server.tsx";
import {credentials, gitHubSignInDto, googleSignInDto, problem, tokens} from "@test/support/data.tsx";
import {getAccessToken, getRefreshToken, onSessionEnded, saveTokens} from "@/api/tokens.tsx";
import {api} from "@/api/client.tsx";
import {
    changePassword,
    forgotPassword,
    login,
    loginWithGitHub,
    loginWithGoogle,
    logout,
    resendVerification,
    resetPassword,
    verifyEmail,
} from "@/api/auth.tsx";

describe("auth", () => {
    const verifyEmailDto = {token: "token"};
    const emailDto = {email: "jan@example.com"};
    const resetPasswordDto = {token: "token", newPassword: "secret"};

    it.each([
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

    describe("loginWithGoogle", () => {
        it("saves the returned tokens after signing in", async () => {
            const requests = mockPost("/auth/google", 200, tokens);

            await loginWithGoogle(googleSignInDto);

            expect(requests).toEqual([googleSignInDto]);
            expect(getAccessToken()).toBe("access-token");
            expect(getRefreshToken()).toBe("refresh-token");
        });

        it("drops the previous tokens when signing in fails", async () => {
            mockPost("/auth/google", 401);
            saveTokens({...tokens, accessToken: "old", refreshToken: "old"});

            await expect(loginWithGoogle(googleSignInDto)).rejects.toThrow();

            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
        });
    });

    describe("loginWithGitHub", () => {
        it("saves the returned tokens after signing in", async () => {
            const requests = mockPost("/auth/github", 200, tokens);

            await loginWithGitHub(gitHubSignInDto);

            expect(requests).toEqual([gitHubSignInDto]);
            expect(getAccessToken()).toBe("access-token");
            expect(getRefreshToken()).toBe("refresh-token");
        });

        it("drops the previous tokens when signing in fails", async () => {
            mockPost("/auth/github", 401);
            saveTokens({...tokens, accessToken: "old", refreshToken: "old"});

            await expect(loginWithGitHub(gitHubSignInDto)).rejects.toThrow();

            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
        });
    });

    describe("login", () => {
        it("saves the returned tokens after signing in", async () => {
            const requests = mockPost("/auth", 200, tokens);

            await login(credentials);

            expect(requests).toEqual([credentials]);
            expect(getAccessToken()).toBe("access-token");
            expect(getRefreshToken()).toBe("refresh-token");
        });

        it("stores no password", async () => {
            mockPost("/auth", 200, tokens);

            await login(credentials);

            expect({...localStorage}).toEqual({refreshToken: "refresh-token"});
            expect(sessionStorage).toHaveLength(0);
        });

        it("doesn't send the previous access token", async () => {
            let authorization: string | null = "";
            server.use(http.post(apiUrl("/auth"), ({request}) => {
                authorization = request.headers.get("Authorization");
                return HttpResponse.json(tokens);
            }));
            saveTokens({...tokens, accessToken: "old", refreshToken: "old"});

            await login(credentials);

            expect(authorization).toBeNull();
        });

        it("drops the previous tokens when signing in fails", async () => {
            mockPost("/auth", 401);
            saveTokens({...tokens, accessToken: "old", refreshToken: "old"});

            await expect(login(credentials)).rejects.toMatchObject({response: {status: 401}});
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
        });
    });

    describe("changePassword", () => {
        const changePasswordDto = {currentPassword: "secret1", newPassword: "secret2"};
        const refreshedTokens = {accessToken: "refreshed-access-token", refreshToken: "refreshed-refresh-token",
            expiresIn: 900};
        const signedInTokens = {accessToken: "signed-in-access-token", refreshToken: "signed-in-refresh-token",
            expiresIn: 900};
        const sessionEnded = vi.fn();
        let stopListening: () => void;

        beforeEach(() => {
            stopListening = onSessionEnded(sessionEnded);
            mockPost("/auth/refresh", 200, refreshedTokens);
            saveTokens(tokens);
        });

        afterEach(() => {
            stopListening();
            sessionEnded.mockReset();
            vi.restoreAllMocks();
        });

        // Answers the change with `status`; returns each request's Authorization header and body.
        function mockChange(status: number) {
            const requests: unknown[] = [];
            server.use(http.patch(apiUrl("/users/me/password"), async ({request}) => {
                requests.push({authorization: request.headers.get("Authorization"), body: await request.json()});
                if (status === 204) {
                    return new HttpResponse(null, {status});
                }
                return HttpResponse.json(problem(status), {status});
            }));
            return requests;
        }

        it("changes the password with a new access token, then signs in again with the new one", async () => {
            const changes = mockChange(204);
            const logins = mockPost("/auth", 200, signedInTokens);
            // Clearing the stored refresh token would end the session in other tabs.
            const removeItem = vi.spyOn(Storage.prototype, "removeItem");

            await expect(changePassword("jan", changePasswordDto)).resolves.toBeUndefined();

            expect(changes).toEqual([{authorization: "Bearer refreshed-access-token", body: changePasswordDto}]);
            expect(logins).toEqual([{userName: "jan", password: "secret2"}]);
            expect(getAccessToken()).toBe("signed-in-access-token");
            expect(getRefreshToken()).toBe("signed-in-refresh-token");
            expect(removeItem).not.toHaveBeenCalled();
            expect(sessionEnded).not.toHaveBeenCalled();
        });

        it("rejects with the change's error without signing in again", async () => {
            mockChange(400);
            const logins = mockPost("/auth", 200, signedInTokens);

            await expect(changePassword("jan", changePasswordDto)).rejects.toMatchObject({response: {status: 400}});

            expect(logins).toEqual([]);
            expect(getRefreshToken()).toBe("refreshed-refresh-token");
            expect(sessionEnded).not.toHaveBeenCalled();
        });

        it("expires the session when signing in again fails", async () => {
            mockChange(204);
            mockNetworkError("/auth");

            await expect(changePassword("jan", changePasswordDto)).resolves.toBeUndefined();

            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
            expect(sessionEnded).toHaveBeenCalledExactlyOnceWith(true);
        });
    });

    describe("logout", () => {
        const sessionEnded = vi.fn();
        let stopListening: () => void;

        beforeEach(() => {
            stopListening = onSessionEnded(sessionEnded);
        });

        afterEach(() => {
            stopListening();
            sessionEnded.mockReset();
        });

        it("ends the session and revokes its refresh token", async () => {
            let authorization: string | null = "";
            const requests: unknown[] = [];
            server.use(http.post(apiUrl("/auth/logout"), async ({request}) => {
                authorization = request.headers.get("Authorization");
                requests.push(await request.json());
                return new HttpResponse(null, {status: 204});
            }));
            saveTokens(tokens);

            await logout();

            expect(requests).toEqual([{refreshToken: "refresh-token"}]);
            // The endpoint is public, and the token sent is the one it revokes.
            expect(authorization).toBeNull();
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
            expect(sessionEnded).toHaveBeenCalledExactlyOnceWith(false);
        });

        it("ends the session without refreshing it after a reload", async () => {
            const refreshes = mockPost("/auth/refresh", 200, tokens);
            const requests = mockPost("/auth/logout");
            localStorage.setItem("refreshToken", "refresh-token");

            await logout();

            expect(refreshes).toEqual([]);
            expect(requests).toEqual([{refreshToken: "refresh-token"}]);
            expect(getRefreshToken()).toBeNull();
        });

        it("ends the session when the request fails, e.g. offline", async () => {
            mockNetworkError("/auth/logout");
            saveTokens(tokens);

            await expect(logout()).resolves.toBeUndefined();
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
            expect(sessionEnded).toHaveBeenCalledExactlyOnceWith(false);
        });

        it("sends nothing when another tab signed out first", async () => {
            const requests = mockPost("/auth/logout");

            await logout();

            expect(requests).toEqual([]);
            expect(sessionEnded).toHaveBeenCalledExactlyOnceWith(false);
        });

        it("waits for a refresh already sent and revokes the refresh token it stored", async () => {
            const refresh = mockPendingRequest("post", "/auth/refresh",
                {body: {...tokens, refreshToken: "new-refresh-token"}});
            const requests = mockPost("/auth/logout");
            mockRequest("post", "/auth/verify", {status: 204});
            // Only the refresh token, so the request refreshes before it's sent.
            localStorage.setItem("refreshToken", "refresh-token");
            const verified = api.post("/auth/verify");
            await vi.waitFor(() => expect(refresh.requestCount()).toBe(1));

            const loggedOut = logout();
            refresh.respond();
            await Promise.all([loggedOut, verified]);

            expect(requests).toEqual([{refreshToken: "new-refresh-token"}]);
            expect(getRefreshToken()).toBeNull();
        });
    });
});

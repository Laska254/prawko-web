import {http, HttpResponse} from "msw/http";
import {apiUrl, mockPost, server} from "@test/support/server.tsx";
import {credentials, tokens} from "@test/support/data.tsx";
import {getAccessToken, getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import {forgotPassword, login, resendVerification, resetPassword, verifyEmail} from "@/api/auth.tsx";

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

            expect(JSON.stringify({...localStorage, ...sessionStorage})).not.toContain("secret");
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
});

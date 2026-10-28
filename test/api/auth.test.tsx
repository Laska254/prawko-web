import {http, HttpResponse} from "msw/http";
import {apiUrl, mockPost, server} from "@test/support/server.tsx";
import {credentials} from "@test/support/data.tsx";
import {getCredentials, saveCredentials} from "@/api/credentials.tsx";
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
});

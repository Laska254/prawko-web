import {http, HttpResponse} from "msw/http";
import {apiUrl, server} from "./test/server.ts";
import {getCredentials, saveCredentials} from "./auth.tsx";
import {forgotPassword, login, register, resendVerification, resetPassword, verifyEmail} from "./requests.tsx";

const credentials = {userName: "jan", password: "secret"};

describe("requests", () => {
    const registerDto = {firstName: "Jan", lastName: "Kowalski", userName: "jan", email: "jan@example.com", password: "secret"};
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
        let received: unknown;
        server.use(http.post(apiUrl(path), async ({request}) => {
            received = await request.json();
            return new HttpResponse(null, {status: 204});
        }));

        const response = await send();

        expect(response.status).toBe(204);
        expect(received).toEqual(body);
    });

    describe("login", () => {
        it("saves the credentials after signing in", async () => {
            let received: unknown;
            server.use(http.post(apiUrl("/auth"), async ({request}) => {
                received = await request.json();
                return new HttpResponse(null, {status: 204});
            }));

            await login(credentials);

            expect(received).toEqual(credentials);
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
            server.use(http.post(apiUrl("/auth"), () => new HttpResponse(null, {status: 401})));
            saveCredentials({userName: "old", password: "old"});

            await expect(login(credentials)).rejects.toMatchObject({response: {status: 401}});
            expect(getCredentials()).toBeNull();
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

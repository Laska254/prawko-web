import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {App} from "@/app/App.tsx";
import {getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import {tokens, user} from "@test/support/data.tsx";
import {startedState, startSignIn} from "@test/support/gitHubSignIn.tsx";
import {renderWithoutRouter} from "@test/support/render.tsx";
import {mockNetworkError, mockPost, mockRequest} from "@test/support/server.tsx";

// Pages are lazy, so tests wait for the page's content before checking it.
function renderAt(path: string) {
    window.history.pushState({}, "", path);
    renderWithoutRouter(<App/>);
}

// Stores tokens whose user loads.
function signIn() {
    saveTokens(tokens);
    mockRequest("get", "/users/me", {body: user});
}

describe("App", () => {
    afterEach(() => vi.unstubAllEnvs());

    it.each([
        ["/", "/auth"],
        ["/exam", "/auth"],
        ["/history", "/auth"],
        ["/profile", "/auth"],
        ["/settings", "/auth"],
        ["/auth/github/callback", "/auth"],
        ["/auth/github/callback/link", "/auth"],
    ])("sends a guest from %s to %s", async (path, expected) => {
        renderAt(path);

        expect(await screen.findByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(window.location.pathname).toBe(expected);
    });

    it.each([
        ["/", "/"],
        ["/exam", "/exam"],
        ["/auth", "/"],
        ["/auth/github/callback", "/"],
    ])("sends a signed in user from %s to %s", async (path, expected) => {
        signIn();

        renderAt(path);

        expect(await screen.findByRole("banner")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
        expect(window.location.pathname).toBe(expected);
        expect(screen.queryByRole("heading", {name: "Sign in"})).not.toBeInTheDocument();
    });

    it("replaces the GitHub callback with the home page, so going back doesn't return to it", async () => {
        const state = await startedState();
        mockPost("/auth/github", 200, tokens);
        mockRequest("get", "/users/me", {body: user});

        renderAt(`/auth/github/callback?code=code&state=${state}`);
        const {length} = window.history;

        expect(await screen.findByRole("banner")).toBeInTheDocument();
        expect(window.location.pathname).toBe("/");
        expect(window.location.search).toBe("");
        expect(window.history.length).toBe(length);
    });

    it("replaces the GitHub link callback with the profile, which asks to confirm linking", async () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        signIn();
        const {searchParams} = await startSignIn("client-id", "/auth/github/callback/link");

        renderAt(`/auth/github/callback/link?code=code&state=${searchParams.get("state")}`);
        const {length} = window.history;

        expect(await screen.findByRole("dialog", {name: "Link GitHub?"})).toBeInTheDocument();
        expect(window.location.pathname).toBe("/profile");
        expect(window.location.search).toBe("");
        expect(window.history.length).toBe(length);
    });

    it("replaces the GitHub callback with the sign in page when signing in fails", async () => {
        const state = await startedState();
        mockPost("/auth/github", 401);

        renderAt(`/auth/github/callback?code=code&state=${state}`);
        const {length} = window.history;

        expect(await screen.findByRole("alert")).toHaveTextContent("Signing in with GitHub failed. Please try again.");
        expect(window.location.pathname).toBe("/auth");
        expect(window.location.search).toBe("");
        expect(window.history.length).toBe(length);
    });

    it.each([
        ["/history", "History"],
        ["/profile", "Profile"],
        ["/settings", "Settings"],
    ])("shows a signed in user %s in the layout", async (path, name) => {
        signIn();

        renderAt(path);

        const heading = await screen.findByRole("heading", {name});
        expect(screen.getByRole("main")).toContainElement(heading);
    });

    it("signs out from the user menu to sign in, and back doesn't return to the signed-in page", async () => {
        signIn();
        const logouts = mockPost("/auth/logout");
        const userEvents = userEvent.setup();
        // Opened from home, as the window's history is shared by the tests: back then goes home, not to another test.
        renderAt("/");
        await userEvents.click(await screen.findByRole("link", {name: "History"}));
        expect(await screen.findByRole("heading", {name: "History"})).toBeInTheDocument();

        await userEvents.click(screen.getByRole("button", {name: "Account"}));
        await userEvents.click(screen.getByRole("menuitem", {name: "Sign out"}));

        expect(await screen.findByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(window.location.pathname).toBe("/auth");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(getRefreshToken()).toBeNull();
        await waitFor(() => expect(logouts).toEqual([{refreshToken: "refresh-token"}]));

        // jsdom goes back after a task, so the test waits for it before checking where the app went.
        await act(() => new Promise(resolve => {
            window.addEventListener("popstate", resolve, {once: true});
            window.history.back();
        }));

        await waitFor(() => expect(window.location.pathname).toBe("/auth"));
        expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    });

    it("signs out when another tab signs out", async () => {
        signIn();
        renderAt("/history");
        expect(await screen.findByRole("heading", {name: "History"})).toBeInTheDocument();

        // Browsers send `storage` events only to the other tabs, so the test plays the tab that signed out.
        act(() => {
            localStorage.removeItem("refreshToken");
            window.dispatchEvent(new StorageEvent("storage",
                {key: "refreshToken", oldValue: "refresh-token", storageArea: localStorage}));
        });

        expect(await screen.findByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(window.location.pathname).toBe("/auth");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("tells the user their session expired once when the refresh token is no longer valid", async () => {
        localStorage.setItem("refreshToken", "refresh-token");
        mockRequest("get", "/users/me", {status: 401});
        const refreshes = mockPost("/auth/refresh", 401);
        // Home comes first, so back goes to a signed-in page of this test.
        window.history.pushState({}, "", "/");

        renderAt("/history");

        expect(await screen.findByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(window.location.pathname).toBe("/auth");
        expect(screen.getByRole("alert")).toHaveTextContent("Your session has expired. Sign in again to continue.");
        expect(refreshes).toHaveLength(1);

        await act(() => new Promise(resolve => {
            window.addEventListener("popstate", resolve, {once: true});
            window.history.back();
        }));

        await waitFor(() => expect(window.location.pathname).toBe("/auth"));
        expect(await screen.findByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("tells the user their password changed once when signing in again with the new one fails", async () => {
        signIn();
        mockPost("/auth/refresh", 200, tokens);
        mockRequest("patch", "/users/me/password", {status: 204});
        mockNetworkError("/auth");
        // Home comes first, so back goes to a signed-in page of this test.
        window.history.pushState({}, "", "/");
        renderAt("/profile");
        const userEvents = userEvent.setup();
        await userEvents.click(await screen.findByRole("button", {name: "Change password"}));
        await userEvents.type(screen.getByLabelText(/^Current password/), "secret1");
        await userEvents.type(screen.getByLabelText(/^New password/), "secret2");
        await userEvents.type(screen.getByLabelText(/^Confirm new password/), "secret2");

        await userEvents.click(screen.getByRole("button", {name: "Save"}));

        expect(await screen.findByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(window.location.pathname).toBe("/auth");
        expect(screen.getByRole("alert")).toHaveTextContent("Your password has been changed. Sign in with the new one.");

        await act(() => new Promise(resolve => {
            window.addEventListener("popstate", resolve, {once: true});
            window.history.back();
        }));

        await waitFor(() => expect(window.location.pathname).toBe("/auth"));
        expect(await screen.findByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    describe.each([
        ["a guest", false],
        ["a signed in user", true],
    ])("for %s", (_, isSignedIn) => {
        it.each(["/unknown", "/auth/unknown", "/history/unknown"])("shows the 404 page at %s", async path => {
            if (isSignedIn) {
                signIn();
            }

            renderAt(path);

            expect(await screen.findByRole("heading", {name: "Page not found"})).toBeInTheDocument();
            expect(window.location.pathname).toBe(path);
            expect(screen.queryByRole("banner")).not.toBeInTheDocument();
        });

        it.each([
            ["/auth/verify", "Verification failed"],
            ["/auth/verify/sent", "Check your email"],
            ["/auth/password/forgot", "Forgot password?"],
            ["/auth/password/reset", "Invalid reset link"],
            ["/account/delete/confirm", "Invalid link"],
        ])("shows %s", async (path, heading) => {
            if (isSignedIn) {
                signIn();
            }

            renderAt(path);

            expect(await screen.findByRole("heading", {name: heading})).toBeInTheDocument();
        });

        // The server ends every session of the account after a reset.
        it("resets the password and goes to sign in signed out", async () => {
            if (isSignedIn) {
                signIn();
            }
            mockPost("/auth/password/reset");
            const userEvents = userEvent.setup();
            renderAt("/auth/password/reset?token=token");

            await userEvents.type(await screen.findByLabelText(/^New password/), "secret1");
            await userEvents.type(screen.getByLabelText(/^Confirm new password/), "secret1");
            await userEvents.click(screen.getByRole("button", {name: "Set new password"}));

            expect(await screen.findByText("Your password has been changed. You can sign in now.")).toBeInTheDocument();
            expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
            expect(window.location.pathname).toBe("/auth");
            expect(getRefreshToken()).toBeNull();
        });

        it("deletes the account and goes to sign in signed out", async () => {
            if (isSignedIn) {
                signIn();
            }
            mockPost("/users/deletion/confirm");
            const userEvents = userEvent.setup();
            renderAt("/account/delete/confirm?token=token");

            await userEvents.click(await screen.findByRole("button", {name: "Delete account"}));

            expect(await screen.findByText("Your account and exam history have been deleted.")).toBeInTheDocument();
            expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
            expect(window.location.pathname).toBe("/auth");
            expect(getRefreshToken()).toBeNull();
        });
    });
});

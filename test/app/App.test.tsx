import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {App} from "@/app/App.tsx";
import {getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import {tokens, user} from "@test/support/data.tsx";
import {renderWithoutRouter} from "@test/support/render.tsx";
import {mockPost, mockRequest} from "@test/support/server.tsx";

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
    it.each([
        ["/", "/auth"],
        ["/exam", "/auth"],
        ["/history", "/auth"],
        ["/profile", "/auth"],
        ["/settings", "/auth"],
    ])("sends a guest from %s to %s", async (path, expected) => {
        renderAt(path);

        expect(await screen.findByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(window.location.pathname).toBe(expected);
    });

    it.each([
        ["/", "/"],
        ["/exam", "/exam"],
        ["/auth", "/"],
    ])("sends a signed in user from %s to %s", async (path, expected) => {
        signIn();

        renderAt(path);

        expect(await screen.findByRole("banner")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
        expect(window.location.pathname).toBe(expected);
        expect(screen.queryByRole("heading", {name: "Sign in"})).not.toBeInTheDocument();
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
    });
});

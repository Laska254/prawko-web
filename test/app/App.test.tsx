import {screen, waitFor} from "@testing-library/react";
import {App} from "@/app/App.tsx";
import {saveCredentials} from "@/api/credentials.tsx";
import {credentials} from "@test/support/data.tsx";
import {renderWithoutRouter} from "@test/support/render.tsx";

// Pages are lazy, so tests wait for the page's content before checking it.
function renderAt(path: string) {
    window.history.pushState({}, "", path);
    renderWithoutRouter(<App/>);
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
        saveCredentials(credentials);

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
    ])("shows a signed in user %s in the layout", async (path, heading) => {
        saveCredentials(credentials);

        renderAt(path);

        expect(screen.getByRole("main")).toContainElement(await screen.findByRole("heading", {name: heading}));
    });

    describe.each([
        ["a guest", false],
        ["a signed in user", true],
    ])("for %s", (_, isSignedIn) => {
        it.each(["/unknown", "/auth/unknown", "/history/unknown"])("shows the 404 page at %s", async path => {
            if (isSignedIn) {
                saveCredentials(credentials);
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
                saveCredentials(credentials);
            }

            renderAt(path);

            expect(await screen.findByRole("heading", {name: heading})).toBeInTheDocument();
        });
    });
});

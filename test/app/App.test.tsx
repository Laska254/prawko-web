import {render, screen} from "@testing-library/react";
import {App} from "@/app/App.tsx";
import {ThemeProviders} from "@/app/ThemeProviders.tsx";
import {saveCredentials} from "@/api/credentials.tsx";
import {credentials} from "@test/support/data.tsx";

function renderAt(path: string) {
    window.history.pushState({}, "", path);
    render(<App/>, {wrapper: ThemeProviders});
}

describe("App", () => {
    it.each([
        ["/", "/auth"],
        ["/exam", "/auth"],
        ["/unknown", "/auth"],
    ])("sends a guest from %s to %s", (path, expected) => {
        renderAt(path);

        expect(window.location.pathname).toBe(expected);
        expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
    });

    it.each([
        ["/", "/"],
        ["/exam", "/exam"],
        ["/auth", "/"],
    ])("sends a signed in user from %s to %s", (path, expected) => {
        saveCredentials(credentials);

        renderAt(path);

        expect(window.location.pathname).toBe(expected);
        expect(screen.queryByRole("heading", {name: "Sign in"})).not.toBeInTheDocument();
    });

    describe.each([
        ["a guest", false],
        ["a signed in user", true],
    ])("for %s", (_, isSignedIn) => {
        it.each([
            ["/auth/verify", "Verification failed"],
            ["/auth/verify/sent", "Check your email"],
            ["/auth/password/forgot", "Forgot password?"],
            ["/auth/password/reset", "Invalid reset link"],
        ])("shows %s", (path, heading) => {
            if (isSignedIn) {
                saveCredentials(credentials);
            }

            renderAt(path);

            expect(screen.getByRole("heading", {name: heading})).toBeInTheDocument();
        });
    });
});

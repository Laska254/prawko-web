import {render, screen} from "@testing-library/react";
import App from "./App.tsx";
import {saveCredentials} from "./auth.tsx";

function renderAt(path: string) {
    window.history.pushState({}, "", path);
    render(<App/>);
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
        saveCredentials({userName: "jan", password: "secret"});

        renderAt(path);

        expect(window.location.pathname).toBe(expected);
        expect(screen.queryByRole("heading", {name: "Sign in"})).not.toBeInTheDocument();
    });

    it.each([
        ["/auth/verify", "Verification failed"],
        ["/auth/verify/sent", "Check your email"],
        ["/auth/password/forgot", "Forgot password?"],
        ["/auth/password/reset", "Invalid reset link"],
    ])("shows %s to everyone", (path, heading) => {
        saveCredentials({userName: "jan", password: "secret"});

        renderAt(path);

        expect(screen.getByRole("heading", {name: heading})).toBeInTheDocument();
    });
});

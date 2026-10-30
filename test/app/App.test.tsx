import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {App} from "@/app/App.tsx";
import {getCredentials, saveCredentials} from "@/api/credentials.tsx";
import {credentials, user} from "@test/support/data.tsx";
import {renderWithoutRouter} from "@test/support/render.tsx";
import {mockPost, mockRequest} from "@test/support/server.tsx";

// Pages are lazy, so tests wait for the page's content before checking it.
function renderAt(path: string) {
    window.history.pushState({}, "", path);
    renderWithoutRouter(<App/>);
}

// Stores credentials whose user loads.
function signIn() {
    saveCredentials(credentials);
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
            expect(getCredentials()).toBeNull();
        });
    });
});

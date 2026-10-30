import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {getCredentials, saveCredentials} from "@/api/credentials.tsx";
import {SessionProvider} from "@/session/SessionProvider.tsx";
import {credentials, user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPost, mockRequest} from "@test/support/server.tsx";
import {ShowSession} from "@test/support/ShowSession.tsx";

function renderSession() {
    renderWithProviders(<SessionProvider><ShowSession/></SessionProvider>);
}

function status(): string | null {
    return screen.getByTestId("status").textContent;
}

describe("SessionProvider", () => {
    it("is signed out without stored credentials", () => {
        renderSession();

        expect(status()).toBe("signedOut");
    });

    it("loads the user of the stored credentials", async () => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {body: user});

        renderSession();

        expect(status()).toBe("loading");
        expect(await screen.findByText("Jan")).toBeInTheDocument();
        expect(status()).toBe("signedIn");
    });

    it("fails when the user can't be loaded and loads it again on retry", async () => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {status: 500});
        renderSession();
        const retry = await screen.findByRole("button", {name: "Retry"});
        expect(status()).toBe("error");

        mockRequest("get", "/users/me", {body: user});
        await userEvent.setup().click(retry);

        expect(await screen.findByText("Jan")).toBeInTheDocument();
        expect(status()).toBe("signedIn");
    });

    it("signs in and loads the user", async () => {
        const signIns = mockPost("/auth");
        mockRequest("get", "/users/me", {body: user});
        renderSession();

        await userEvent.setup().click(screen.getByRole("button", {name: "Sign in"}));

        expect(await screen.findByText("Jan")).toBeInTheDocument();
        expect(status()).toBe("signedIn");
        expect(signIns).toEqual([credentials]);
        expect(getCredentials()).not.toBeNull();
    });

    it("stays signed out and loads no user when signing in fails", async () => {
        mockPost("/auth", 401);
        const requests = mockRequest("get", "/users/me", {body: user});
        renderSession();

        await userEvent.setup().click(screen.getByRole("button", {name: "Sign in"}));

        expect(await screen.findByText("Sign in failed")).toBeInTheDocument();
        expect(status()).toBe("signedOut");
        expect(requests).toEqual([]);
    });

    it("stays signed out and forgets the credentials when the signed in user can't be loaded", async () => {
        mockPost("/auth");
        mockRequest("get", "/users/me", {status: 500});
        renderSession();

        await userEvent.setup().click(screen.getByRole("button", {name: "Sign in"}));

        expect(await screen.findByText("Sign in failed")).toBeInTheDocument();
        expect(status()).toBe("signedOut");
        expect(getCredentials()).toBeNull();
    });
});

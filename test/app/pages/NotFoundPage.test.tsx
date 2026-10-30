import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {NotFoundPage} from "@/app/pages/NotFoundPage.tsx";
import {saveCredentials} from "@/api/credentials.tsx";
import {credentials, user} from "@test/support/data.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockRequest} from "@test/support/server.tsx";
import {ShowSession} from "@test/support/ShowSession.tsx";

// Shows the session's status too, to check the link once the session is in that status.
function renderPage() {
    renderAtRoute(<><NotFoundPage/><ShowSession/></>, "/unknown");
}

async function waitForStatus(status: string) {
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent(status));
}

describe("NotFoundPage", () => {
    it.each([
        ["a guest", false, "signedOut", "Back to sign in", "/auth"],
        ["a signed in user", true, "signedIn", "Back to home", "/"],
    ])("sends %s back", async (_, isSignedIn, status, link, expected) => {
        if (isSignedIn) {
            saveCredentials(credentials);
            mockRequest("get", "/users/me", {body: user});
        }
        renderPage();
        await waitForStatus(status);

        const main = screen.getByRole("main");
        expect(within(main).getByRole("heading", {name: "Page not found"})).toBeInTheDocument();
        expect(within(main).getByText("The page you are looking for doesn't exist or has moved.")).toBeInTheDocument();
        expect(within(main).getByRole("button", {name: "Language"})).toBeInTheDocument();
        expect(within(main).getByRole("button", {name: "Theme: system"})).toBeInTheDocument();

        await userEvent.setup().click(screen.getByRole("link", {name: link}));

        expect(currentLocation().pathname).toBe(expected);
    });

    it("sends a user still loading home", () => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {body: user});

        renderPage();

        expect(screen.getByTestId("status")).toHaveTextContent("loading");
        expect(screen.getByRole("link", {name: "Back to home"})).toHaveAttribute("href", "/");
    });

    it("sends a user that can't be loaded home", async () => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {status: 500});

        renderPage();
        await waitForStatus("error");

        expect(screen.getByRole("link", {name: "Back to home"})).toHaveAttribute("href", "/");
    });
});

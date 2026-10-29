import {screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {NotFoundPage} from "@/app/pages/NotFoundPage.tsx";
import {saveCredentials} from "@/api/credentials.tsx";
import {credentials} from "@test/support/data.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";

describe("NotFoundPage", () => {
    it.each([
        ["a guest", false, "Back to sign in", "/auth"],
        ["a signed in user", true, "Back to home", "/"],
    ])("sends %s back", async (_, isSignedIn, link, expected) => {
        if (isSignedIn) {
            saveCredentials(credentials);
        }
        renderAtRoute(<NotFoundPage/>, "/unknown");

        const main = screen.getByRole("main");
        expect(within(main).getByRole("heading", {name: "Page not found"})).toBeInTheDocument();
        expect(within(main).getByText("The page you are looking for doesn't exist or has moved.")).toBeInTheDocument();
        expect(within(main).getByRole("button", {name: "Theme: system"})).toBeInTheDocument();

        await userEvent.setup().click(screen.getByRole("link", {name: link}));

        expect(currentLocation().pathname).toBe(expected);
    });
});

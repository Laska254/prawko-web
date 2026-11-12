import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "i18next";
import {GitHubButton} from "@/components/github/GitHubButton.tsx";
import {takeGitHubAuthorization} from "@/components/github/gitHubAuthorization.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("GitHubButton", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("goes to GitHub with the client ID and the page to come back to, and stores what it started", async () => {
        const assign = vi.fn();
        vi.stubGlobal("location", {...window.location, assign});
        renderWithProviders(<GitHubButton clientId="client-id" redirectPath="/back"/>);

        await userEvent.setup().click(screen.getByRole("button", {name: "Continue with GitHub"}));

        await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
        const {origin, searchParams} = new URL(assign.mock.calls[0][0]);
        expect(origin).toBe("https://github.com");
        expect(searchParams.get("client_id")).toBe("client-id");
        expect(searchParams.get("redirect_uri")).toBe(`${window.location.origin}/back`);
        expect(takeGitHubAuthorization(searchParams.get("state"))).not.toBeNull();
    });

    it("is in the app's language", async () => {
        renderWithProviders(<GitHubButton clientId="client-id" redirectPath="/back"/>);

        await i18n.changeLanguage("pl");

        expect(await screen.findByRole("button", {name: "Kontynuuj przy użyciu konta GitHub"})).toBeInTheDocument();
    });
});

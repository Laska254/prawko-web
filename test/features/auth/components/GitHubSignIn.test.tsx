import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "i18next";
import {GitHubSignIn} from "@/features/auth/components/GitHubSignIn.tsx";
import {takeGitHubCodeVerifier} from "@/features/auth/gitHubAuthorization.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("GitHubSignIn", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("goes to GitHub with the client ID and stores the started sign in", async () => {
        const assign = vi.fn();
        vi.stubGlobal("location", {...window.location, assign});
        renderWithProviders(<GitHubSignIn clientId="client-id"/>);

        await userEvent.setup().click(screen.getByRole("button", {name: "Continue with GitHub"}));

        await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
        const {origin, searchParams} = new URL(assign.mock.calls[0][0]);
        expect(origin).toBe("https://github.com");
        expect(searchParams.get("client_id")).toBe("client-id");
        expect(takeGitHubCodeVerifier(searchParams.get("state"))).not.toBeNull();
    });

    it("is in the app's language", async () => {
        renderWithProviders(<GitHubSignIn clientId="client-id"/>);

        await i18n.changeLanguage("pl");

        expect(await screen.findByRole("button", {name: "Kontynuuj przy użyciu konta GitHub"})).toBeInTheDocument();
    });
});

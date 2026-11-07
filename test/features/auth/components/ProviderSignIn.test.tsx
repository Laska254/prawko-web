import {screen, waitFor} from "@testing-library/react";
import i18n from "i18next";
import {ProviderSignIn} from "@/features/auth/components/ProviderSignIn.tsx";
import {failGoogleScript, googleScripts, loadGoogleScript} from "@test/support/googleScript.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

function renderProviders() {
    return renderWithProviders(<ProviderSignIn formType="login"/>);
}

function gitHubButton() {
    return screen.queryByRole("button", {name: "Continue with GitHub"});
}

describe("ProviderSignIn", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it("shows nothing without client IDs", () => {
        renderProviders();

        expect(gitHubButton()).not.toBeInTheDocument();
        expect(googleScripts()).toHaveLength(0);
        expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    });

    it("shows Google's button above the divider with only its client ID", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        renderProviders();
        loadGoogleScript();

        const google = await screen.findByRole("button", {name: "Continue with Google"});

        expect(gitHubButton()).not.toBeInTheDocument();
        expect(google.compareDocumentPosition(screen.getByRole("separator")))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("shows GitHub's button above the divider with only its client ID", () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");

        renderProviders();

        expect(googleScripts()).toHaveLength(0);
        expect(gitHubButton()!.compareDocumentPosition(screen.getByRole("separator")))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("shows both buttons over one divider, Google's first", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        renderProviders();
        loadGoogleScript();

        const google = await screen.findByRole("button", {name: "Continue with Google"});

        expect(google.compareDocumentPosition(gitHubButton()!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(screen.getAllByRole("separator")).toHaveLength(1);
        expect(screen.getByRole("separator")).toHaveTextContent("or");
    });

    it("translates the divider", async () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        renderProviders();

        await i18n.changeLanguage("pl");

        await waitFor(() => expect(screen.getByRole("separator")).toHaveTextContent("lub"));
    });

    it("shows nothing when Google's script can't be loaded and there's no GitHub", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        renderProviders();
        expect(screen.getByRole("separator")).toBeInTheDocument();

        failGoogleScript();

        await waitFor(() => expect(screen.queryByRole("separator")).not.toBeInTheDocument());
        expect(googleScripts()).toHaveLength(0);
    });

    it("keeps GitHub's button and the divider when Google's script can't be loaded", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        renderProviders();

        failGoogleScript();

        await waitFor(() => expect(googleScripts()).toHaveLength(0));
        expect(gitHubButton()).toBeInTheDocument();
        expect(screen.getByRole("separator")).toBeInTheDocument();
    });

    it("doesn't try Google's script again when the language changes", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        renderProviders();
        failGoogleScript();
        await waitFor(() => expect(screen.queryByRole("separator")).not.toBeInTheDocument());

        await i18n.changeLanguage("pl");

        await waitFor(() => expect(document.documentElement.lang).toBe("pl"));
        expect(googleScripts()).toHaveLength(0);
    });

    it("leaves GitHub out outside a secure context, where a sign in can't start", () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        vi.spyOn(crypto, "subtle", "get").mockReturnValue(undefined as unknown as SubtleCrypto);

        renderProviders();

        expect(gitHubButton()).not.toBeInTheDocument();
        expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    });
});

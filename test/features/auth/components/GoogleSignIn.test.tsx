import {screen, waitFor} from "@testing-library/react";
import i18n from "i18next";
import {getRefreshToken} from "@/api/tokens.tsx";
import {GoogleSignIn} from "@/features/auth/components/GoogleSignIn.tsx";
import {googleSignInDto, tokens, user} from "@test/support/data.tsx";
import {failGoogleScript, googleScripts, loadGoogleScript} from "@test/support/googleScript.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost, mockProblem, mockRequest} from "@test/support/server.tsx";
import {cssRules} from "@test/support/styles.tsx";

const CLIENT_ID = "client-id";
const {idToken} = googleSignInDto;

function renderGoogleSignIn() {
    return renderAtRoute(<GoogleSignIn clientId={CLIENT_ID}/>, "/auth");
}

function findButton() {
    return screen.findByRole("button", {name: "Continue with Google"});
}

async function renderLoaded() {
    renderGoogleSignIn();
    const google = loadGoogleScript();
    await findButton();
    return google;
}

describe("GoogleSignIn", () => {
    it("loads Google's script once and initializes it once with the client ID", async () => {
        const {configs} = await renderLoaded();

        expect(googleScripts()).toHaveLength(1);
        expect(configs.map(config => config.client_id)).toEqual([CLIENT_ID]);
    });

    it("renders one button in the app's language and light theme", async () => {
        const {buttons} = await renderLoaded();

        expect(screen.getAllByRole("button")).toHaveLength(1);
        expect(buttons.at(-1)).toEqual({theme: "outline", text: "continue_with", width: 0, locale: "en"});
        expect(screen.getByRole("separator")).toHaveTextContent("or");
    });

    it("renders the dark button in dark mode", async () => {
        localStorage.setItem("mui-mode", "dark");

        const {buttons} = await renderLoaded();

        expect(buttons.at(-1)?.theme).toBe("filled_black");
    });

    it("keeps the button's iframe light, so a dark page doesn't paint a white backdrop behind it", async () => {
        localStorage.setItem("mui-mode", "dark");
        await renderLoaded();

        const button = await findButton();

        expect(cssRules(button.parentElement!)).toContain("color-scheme: light");
    });

    it("renders the button again when the language changes, without initializing again", async () => {
        const {buttons, configs} = await renderLoaded();

        await i18n.changeLanguage("pl");

        await waitFor(() => expect(buttons.at(-1)?.locale).toBe("pl"));
        expect(screen.getAllByRole("button")).toHaveLength(1);
        expect(screen.getByRole("separator")).toHaveTextContent("lub");
        expect(configs).toHaveLength(1);
    });

    it("doesn't render a button after leaving the page while the script loads", async () => {
        const {unmount} = renderGoogleSignIn();
        unmount();

        const {buttons} = loadGoogleScript();

        await Promise.resolve();
        expect(buttons).toEqual([]);
    });

    it("reuses the loaded script when the page is opened again", async () => {
        const {unmount} = renderGoogleSignIn();
        const {configs, buttons} = loadGoogleScript();
        await findButton();
        const rendered = buttons.length;
        unmount();

        renderGoogleSignIn();

        await findButton();
        expect(buttons.length).toBeGreaterThan(rendered);
        expect(googleScripts()).toHaveLength(1);
        expect(configs).toHaveLength(1);
    });

    it("signs in with the ID token and goes home", async () => {
        const requests = mockPost("/auth/google", 200, tokens);
        mockRequest("get", "/users/me", {body: user});
        const {sendCredential} = await renderLoaded();

        await sendCredential(idToken);

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation().pathname).toBe("/");
        expect(requests).toEqual([googleSignInDto]);
        expect(getRefreshToken()).toBe(tokens.refreshToken);
    });

    it("ignores a credential once the page was left", async () => {
        const requests = mockPost("/auth/google", 200, tokens);
        const {unmount} = renderGoogleSignIn();
        const {sendCredential} = loadGoogleScript();
        await findButton();
        unmount();

        await sendCredential(idToken);

        expect(requests).toEqual([]);
    });

    it("blocks the button and shows progress while sending", async () => {
        const {respond} = mockPendingPost("/auth/google", 401);
        const {sendCredential} = await renderLoaded();
        const button = await findButton();
        expect(button.parentElement).not.toHaveAttribute("inert");

        await sendCredential(idToken);

        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        expect(button.parentElement).toHaveAttribute("inert");

        respond();

        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        expect(button.parentElement).not.toHaveAttribute("inert");
    });

    it.each([
        [401, "Signing in with Google failed. Please try again."],
        [403, "Google hasn't verified the email address of this account."],
        [404, "Signing in with Google isn't available right now."],
        [409, "An account with this email already exists and can't use this Google account. Sign in to it another way."],
        [429, "Too many attempts. Wait a moment and try again."],
        [503, "The service is temporarily unavailable. Please try again later."],
    ])("shows the message of a %i and stays", async (status, message) => {
        mockProblem("/auth/google", status);
        const {sendCredential} = await renderLoaded();

        await sendCredential(idToken);

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.queryByTestId("location")).not.toBeInTheDocument();
        expect(getRefreshToken()).toBeNull();
    });

    it("shows a network error", async () => {
        mockNetworkError("/auth/google");
        const {sendCredential} = await renderLoaded();

        await sendCredential(idToken);

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Can't reach the server. Check your connection and try again.");
    });

    it("clears the error when signing in again", async () => {
        mockProblem("/auth/google", 401);
        const {sendCredential} = await renderLoaded();
        await sendCredential(idToken);
        await screen.findByRole("alert");

        mockPendingPost("/auth/google");
        await sendCredential(idToken);

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("leaves itself out when the script can't be loaded", async () => {
        renderGoogleSignIn();

        failGoogleScript();

        await waitFor(() => expect(screen.queryByRole("separator")).not.toBeInTheDocument());
        expect(googleScripts()).toHaveLength(0);
    });

    it("doesn't try the script again when the language changes", async () => {
        renderGoogleSignIn();
        failGoogleScript();
        await waitFor(() => expect(screen.queryByRole("separator")).not.toBeInTheDocument());

        await i18n.changeLanguage("pl");

        await waitFor(() => expect(document.documentElement.lang).toBe("pl"));
        expect(googleScripts()).toHaveLength(0);
    });

    it("tries the script again when the page is opened again", async () => {
        const {unmount} = renderGoogleSignIn();
        failGoogleScript();
        await waitFor(() => expect(screen.queryByRole("separator")).not.toBeInTheDocument());
        unmount();

        await renderLoaded();

        expect(googleScripts()).toHaveLength(1);
    });
});

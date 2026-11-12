import {screen, waitFor} from "@testing-library/react";
import i18n from "i18next";
import {GoogleButton} from "@/components/google/GoogleButton.tsx";
import {failGoogleScript, googleScripts, loadGoogleScript} from "@test/support/googleScript.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {cssRules} from "@test/support/styles.tsx";

const CLIENT_ID = "client-id";

const onCredential = vi.fn();
const setUnavailable = vi.fn();

function renderGoogleButton(disabled = false) {
    return renderWithProviders(
        <GoogleButton clientId={CLIENT_ID} onCredential={onCredential} setUnavailable={setUnavailable} disabled={disabled}/>
    );
}

function findButton() {
    return screen.findByRole("button", {name: "Continue with Google"});
}

async function renderLoaded(disabled = false) {
    renderGoogleButton(disabled);
    const google = loadGoogleScript();
    await findButton();
    return google;
}

describe("GoogleButton", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        onCredential.mockClear();
        setUnavailable.mockClear();
    });

    it("loads Google's script once and initializes it once with the client ID", async () => {
        const {configs} = await renderLoaded();

        expect(googleScripts()).toHaveLength(1);
        expect(configs.map(config => config.client_id)).toEqual([CLIENT_ID]);
    });

    it("renders one button as wide as its parent, in the app's language and light theme", async () => {
        vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(358);

        const {buttons} = await renderLoaded();

        expect(screen.getAllByRole("button")).toHaveLength(1);
        expect(buttons.at(-1)).toEqual({theme: "outline", text: "continue_with", width: 358, locale: "en"});
        expect(setUnavailable).not.toHaveBeenCalled();
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
        expect(configs).toHaveLength(1);
    });

    it("doesn't render a button after leaving the page while the script loads", async () => {
        const {unmount} = renderGoogleButton();
        unmount();

        const {buttons} = loadGoogleScript();

        await Promise.resolve();
        expect(buttons).toEqual([]);
    });

    it("reuses the loaded script when the page is opened again", async () => {
        const {unmount} = renderGoogleButton();
        const {configs, buttons} = loadGoogleScript();
        await findButton();
        const rendered = buttons.length;
        unmount();

        renderGoogleButton();

        await findButton();
        expect(buttons.length).toBeGreaterThan(rendered);
        expect(googleScripts()).toHaveLength(1);
        expect(configs).toHaveLength(1);
    });

    it("hands over the ID token of a sign-in through the button", async () => {
        const {sendCredential} = await renderLoaded();

        await sendCredential("google-id-token");

        expect(onCredential).toHaveBeenCalledExactlyOnceWith("google-id-token");
    });

    it("ignores a credential once the page was left", async () => {
        const {unmount} = renderGoogleButton();
        const {sendCredential} = loadGoogleScript();
        await findButton();
        unmount();

        await sendCredential("google-id-token");

        expect(onCredential).not.toHaveBeenCalled();
    });

    it.each([false, true])("blocks the button only while disabled (%s)", async disabled => {
        await renderLoaded(disabled);

        const button = await findButton();

        expect(button.parentElement!.hasAttribute("inert")).toBe(disabled);
    });

    it("tells the parent when the script can't be loaded", async () => {
        renderGoogleButton();

        failGoogleScript();

        await waitFor(() => expect(setUnavailable).toHaveBeenCalledWith(true));
        expect(googleScripts()).toHaveLength(0);
    });

    it("tries the script again when the page is opened again", async () => {
        const {unmount} = renderGoogleButton();
        failGoogleScript();
        await waitFor(() => expect(setUnavailable).toHaveBeenCalledWith(true));
        unmount();

        await renderLoaded();

        expect(googleScripts()).toHaveLength(1);
    });
});

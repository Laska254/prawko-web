import i18n from "i18next";
import {chooseLanguage, resources} from "@/i18n/i18n.tsx";

// The instance is set up once by test/support/setup.tsx; calling `changeLanguage` without a language detects it again.
async function detectWithBrowserLanguages(languages: readonly string[]) {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
    vi.spyOn(navigator, "language", "get").mockReturnValue(languages[0]);
    await i18n.changeLanguage();
}

// Every text's key path with the `{{value}}` and `<tag/>` placeholders it uses, e.g. ".auth.verificationSent.sentToEmail
// <email/>".
function textKeys(texts: object, path: string): string[] {
    return Object.entries(texts).flatMap(([key, value]) => {
        if (typeof value === "string") {
            return [[`${path}.${key}`, ...(value.match(/{{\w+}}|<\w+\/>/g) ?? [])].join(" ")];
        }
        return textKeys(value, `${path}.${key}`);
    });
}

describe("i18n", () => {
    afterEach(() => vi.restoreAllMocks());

    it("follows the browser language", async () => {
        await detectWithBrowserLanguages(["en-GB", "en"]);

        expect(i18n.language).toBe("en-GB");
        expect(i18n.resolvedLanguage).toBe("en");
        expect(i18n.t("cancel")).toBe("Cancel");
        expect(document.documentElement).toHaveAttribute("lang", "en-GB");
    });

    it("uses Polish for a Polish browser", async () => {
        await detectWithBrowserLanguages(["pl-PL", "pl"]);

        expect(i18n.resolvedLanguage).toBe("pl");
        expect(i18n.t("cancel")).toBe("Anuluj");
    });

    it("falls back to English for a language without texts", async () => {
        await detectWithBrowserLanguages(["de-DE", "de"]);

        expect(i18n.language).toBe("en");
        expect(i18n.t("cancel")).toBe("Cancel");
    });

    it("stores the chosen language and uses it on the next visit", async () => {
        await chooseLanguage("pl");
        expect(localStorage.getItem("language")).toBe("pl");
        expect(document.documentElement).toHaveAttribute("lang", "pl");

        await detectWithBrowserLanguages(["en-US", "en"]);

        expect(i18n.resolvedLanguage).toBe("pl");
        expect(i18n.t("cancel")).toBe("Anuluj");
    });

    it("skips a stored language without texts", async () => {
        localStorage.setItem("language", "de");

        await detectWithBrowserLanguages(["pl-PL", "pl"]);

        expect(i18n.resolvedLanguage).toBe("pl");
    });

    it("has the same keys and placeholders in Polish as in English", () => {
        expect(textKeys(resources.pl, "")).toEqual(textKeys(resources.en, ""));
    });
});

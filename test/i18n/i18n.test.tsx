import i18n from "i18next";

// The instance is set up once by test/support/setup.tsx; calling `changeLanguage` without a language detects it again.
async function detectWithBrowserLanguages(languages: readonly string[]) {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
    vi.spyOn(navigator, "language", "get").mockReturnValue(languages[0]);
    await i18n.changeLanguage();
}

describe("i18n", () => {
    afterEach(async () => {
        vi.restoreAllMocks();
        await i18n.changeLanguage();
    });

    it("follows the browser language", async () => {
        await detectWithBrowserLanguages(["en-GB", "en"]);

        expect(i18n.language).toBe("en-GB");
        expect(i18n.resolvedLanguage).toBe("en");
        expect(i18n.t("cancel")).toBe("Cancel");
    });

    it("falls back to English for a language without texts", async () => {
        await detectWithBrowserLanguages(["de-DE", "de"]);

        expect(i18n.language).toBe("en");
        expect(i18n.t("cancel")).toBe("Cancel");
    });
});

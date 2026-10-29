import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {initReactI18next} from "react-i18next";
import common from "./locales/en/common.json";

export const resources = {
    en: {common},
};

// Typed keys: `t` only accepts keys that exist in the English resources of the namespaces it was given.
declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "common";
        resources: (typeof resources)["en"];
    }
}

// Imported once for its side effect (main.tsx, test setup). Resources are bundled, so `initAsync: false` makes the
// texts ready before the first render. The browser language is used when supported (`en-US` counts as `en`),
// otherwise English.
void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        defaultNS: "common",
        supportedLngs: ["en"],
        nonExplicitSupportedLngs: true,
        fallbackLng: "en",
        detection: {order: ["navigator"], caches: []},
        // React already escapes rendered text.
        interpolation: {escapeValue: false},
        initAsync: false,
    });

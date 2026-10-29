import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {initReactI18next} from "react-i18next";
import enApp from "./locales/en/app.json";
import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enExam from "./locales/en/exam.json";
import enProfile from "./locales/en/profile.json";
import plApp from "./locales/pl/app.json";
import plAuth from "./locales/pl/auth.json";
import plCommon from "./locales/pl/common.json";
import plErrors from "./locales/pl/errors.json";
import plExam from "./locales/pl/exam.json";
import plProfile from "./locales/pl/profile.json";

const en = {common: enCommon, errors: enErrors, app: enApp, auth: enAuth, exam: enExam, profile: enProfile};

// Typed as English, so a key missing in Polish fails the build; extra Polish keys are caught by i18n.test.tsx.
const pl: typeof en = {common: plCommon, errors: plErrors, app: plApp, auth: plAuth, exam: plExam, profile: plProfile};

export const resources = {en, pl};

// Names in their own language, so readers find theirs whatever language the page is in.
export const LANGUAGES = [
    {code: "en", name: "English"},
    {code: "pl", name: "Polski"},
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "language";

// Only a chosen language is stored, so until then the app keeps following the browser.
export function chooseLanguage(language: Language) {
    localStorage.setItem(STORAGE_KEY, language);
    return i18n.changeLanguage(language);
}

// Typed keys: `t` only accepts keys that exist in the English resources of the namespaces it was given.
declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "common";
        resources: (typeof resources)["en"];
    }
}

// `<html lang>` follows the texts for screen readers and the browser. Registered before `init`, which sets the first
// language.
i18n.on("languageChanged", language => {
    document.documentElement.lang = language;
});

// Imported once for its side effect (main.tsx, test setup). Resources are bundled, so `initAsync: false` makes the
// texts ready before the first render. The chosen language comes first, then the browser language when supported
// (`pl-PL` counts as `pl`), otherwise English. An unsupported stored value is skipped.
void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        defaultNS: "common",
        supportedLngs: LANGUAGES.map(({code}) => code),
        nonExplicitSupportedLngs: true,
        fallbackLng: "en",
        detection: {order: ["localStorage", "navigator"], lookupLocalStorage: STORAGE_KEY, caches: []},
        // React already escapes rendered text.
        interpolation: {escapeValue: false},
        initAsync: false,
    });

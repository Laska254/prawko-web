import "@testing-library/jest-dom/vitest";
import i18n from "i18next";
// The app's English texts, so tests find what users read.
import "@/i18n/i18n.tsx";
import {server} from "./server.tsx";

beforeAll(() => server.listen({onUnhandledFrame: "error"}));
afterEach(async () => {
    server.resetHandlers();
    sessionStorage.clear();
    localStorage.clear();
    // The colour scheme class MUI or index.html's script put on <html>.
    document.documentElement.className = "";
    // Back to English after a test chose or detected another language (runs after the test file's own `afterEach`).
    await i18n.changeLanguage();
});
afterAll(() => server.close());

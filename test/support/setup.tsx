import "@testing-library/jest-dom/vitest";
import {configure} from "@testing-library/react";
import i18n from "i18next";
// The app's English texts, so tests find what users read.
import "@/i18n/i18n.tsx";
import {clearTokens} from "@/api/tokens.tsx";
import {resetGoogleScript} from "./googleScript.tsx";
import {fakeLocks} from "./locks.tsx";
import {server} from "./server.tsx";

// `findBy*` and `waitFor` wait 3 s instead of 1 s, as a lazy page can take longer to load on a busy machine. Still under
// the 5 s test timeout, so a missing element fails with the rendered DOM.
configure({asyncUtilTimeout: 3000});

// As in browsers served over HTTPS; a getter, so a test can take it away with `vi.spyOn(navigator, "locks", "get")`.
Object.defineProperty(navigator, "locks", {get: () => fakeLocks, configurable: true});

beforeAll(() => server.listen({onUnhandledFrame: "error"}));
afterEach(async () => {
    server.resetHandlers();
    sessionStorage.clear();
    localStorage.clear();
    // The access token lives in memory, which clearing the storages doesn't reach.
    clearTokens();
    resetGoogleScript();
    // The colour scheme class MUI or index.html's script put on <html>.
    document.documentElement.className = "";
    // Back to English after a test chose or detected another language (runs after the test file's own `afterEach`).
    await i18n.changeLanguage();
});
afterAll(() => server.close());

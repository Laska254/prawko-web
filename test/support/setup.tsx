import "@testing-library/jest-dom/vitest";
import {server} from "./server.tsx";

beforeAll(() => server.listen({onUnhandledFrame: "error"}));
afterEach(() => {
    server.resetHandlers();
    sessionStorage.clear();
    localStorage.clear();
    // The colour scheme class MUI or index.html's script put on <html>.
    document.documentElement.className = "";
});
afterAll(() => server.close());

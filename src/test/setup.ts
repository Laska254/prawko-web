import "@testing-library/jest-dom/vitest";
import {server} from "./server.ts";

beforeAll(() => server.listen({onUnhandledFrame: "error"}));
afterEach(() => {
    server.resetHandlers();
    sessionStorage.clear();
});
afterAll(() => server.close());

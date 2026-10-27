import "@testing-library/jest-dom/vitest";
import {server} from "./server.tsx";

beforeAll(() => server.listen({onUnhandledFrame: "error"}));
afterEach(() => {
    server.resetHandlers();
    sessionStorage.clear();
});
afterAll(() => server.close());

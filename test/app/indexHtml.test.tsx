import html from "/index.html?raw";

// jsdom doesn't run scripts from HTML, so the inline colour scheme script is run directly.
const script = new DOMParser().parseFromString(html, "text/html").querySelector("script:not([src])")!.textContent;

function runScript({mode, systemDark = false}: {mode?: string; systemDark?: boolean}) {
    if (mode) {
        localStorage.setItem("mui-mode", mode);
    }
    vi.stubGlobal("matchMedia", (query: string) => ({matches: systemDark && query === "(prefers-color-scheme: dark)"}));
    new Function(script)();
}

describe("index.html", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        document.documentElement.className = "";
    });

    it.each([
        {mode: "light", systemDark: true, scheme: "light"},
        {mode: "dark", systemDark: false, scheme: "dark"},
        {mode: "system", systemDark: true, scheme: "dark"},
        {mode: "system", systemDark: false, scheme: "light"},
        {mode: undefined, systemDark: true, scheme: "dark"},
    ])("sets the $scheme class for the $mode mode (system dark: $systemDark)", ({mode, systemDark, scheme}) => {
        runScript({mode, systemDark});

        expect(document.documentElement.className).toBe(scheme);
    });

    it("leaves the class unset when the storage can't be read", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });

        runScript({});

        expect(document.documentElement.className).toBe("");
    });
});

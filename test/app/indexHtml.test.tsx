import html from "/index.html?raw";

const page = new DOMParser().parseFromString(html, "text/html");
// jsdom doesn't run scripts from HTML, so the inline colour scheme script is run directly.
const script = page.querySelector("script:not([src])")!.textContent;
const style = page.querySelector("style")!;

function runScript({mode, systemDark = false}: {mode?: string; systemDark?: boolean}) {
    if (mode) {
        localStorage.setItem("mui-mode", mode);
    }
    vi.stubGlobal("matchMedia", (query: string) => ({matches: systemDark && query === "(prefers-color-scheme: dark)"}));
    new Function(script)();
}

describe("index.html", () => {
    beforeEach(() => document.head.append(style));

    afterEach(() => {
        style.remove();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it.each([
        {mode: "light", systemDark: true, scheme: "light", colorScheme: "normal"},
        {mode: "dark", systemDark: false, scheme: "dark", colorScheme: "dark"},
        {mode: "system", systemDark: true, scheme: "dark", colorScheme: "dark"},
        {mode: "system", systemDark: false, scheme: "light", colorScheme: "normal"},
        {mode: undefined, systemDark: true, scheme: "dark", colorScheme: "dark"},
    ])("sets the $scheme class for the $mode mode (system dark: $systemDark)", ({mode, systemDark, scheme, colorScheme}) => {
        runScript({mode, systemDark});

        expect(document.documentElement.className).toBe(scheme);
        // Until the app loads, the browser's canvas colour is all there is to see.
        expect(getComputedStyle(document.documentElement).colorScheme).toBe(colorScheme);
    });

    it("leaves the class unset when the storage can't be read", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });

        runScript({});

        expect(document.documentElement.className).toBe("");
    });
});

import {renderWithProviders} from "@test/support/render.tsx";

function rootStyle(property: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(property);
}

// Emotion strips the spaces after commas, so the shadows are written without them.
describe("theme", () => {
    afterEach(() => document.documentElement.classList.remove("dark"));

    it("uses the light colours by default", () => {
        renderWithProviders(<div/>);

        expect(rootStyle("color-scheme")).toBe("light");
        expect(rootStyle("--mui-palette-background-default")).toBe("#e8eef7");
        expect(rootStyle("--mui-shadows-1")).toBe("0 1px 2px rgba(30,58,138,0.06),0 8px 24px rgba(30,58,138,0.08)");
    });

    it("switches the colours and the panel shadow with the dark class", () => {
        document.documentElement.classList.add("dark");
        renderWithProviders(<div/>);

        expect(rootStyle("color-scheme")).toBe("dark");
        expect(rootStyle("--mui-palette-background-default")).toBe("#0f172a");
        expect(rootStyle("--mui-shadows-1")).toBe("0 1px 2px rgba(0,0,0,0.3),0 8px 24px rgba(0,0,0,0.4)");
    });
});

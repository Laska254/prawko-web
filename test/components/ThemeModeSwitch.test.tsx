import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

function stubSystemDark(matches: boolean) {
    vi.stubGlobal("matchMedia", () => ({matches, addListener: vi.fn(), removeListener: vi.fn()}));
}

describe("ThemeModeSwitch", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("follows the system by default", () => {
        stubSystemDark(true);
        renderWithProviders(<ThemeModeSwitch/>);

        expect(screen.getByRole("button", {name: "Theme: system"})).toBeInTheDocument();
        expect(document.documentElement).toHaveClass("dark");
    });

    it("starts with the stored mode", () => {
        stubSystemDark(true);
        localStorage.setItem("mui-mode", "light");
        renderWithProviders(<ThemeModeSwitch/>);

        expect(screen.getByRole("button", {name: "Theme: light"})).toBeInTheDocument();
        expect(document.documentElement).toHaveClass("light");
    });

    it("shows an unknown stored mode as system", () => {
        stubSystemDark(false);
        localStorage.setItem("mui-mode", "auto");
        renderWithProviders(<ThemeModeSwitch/>);

        expect(screen.getByRole("button", {name: "Theme: system"})).toBeInTheDocument();
    });

    it("cycles light, dark and system and stores the mode", async () => {
        const user = userEvent.setup();
        stubSystemDark(false);
        renderWithProviders(<ThemeModeSwitch/>);

        await user.click(screen.getByRole("button", {name: "Theme: system"}));
        expect(document.documentElement).toHaveClass("light");
        expect(localStorage.getItem("mui-mode")).toBe("light");

        await user.click(screen.getByRole("button", {name: "Theme: light"}));
        expect(document.documentElement).toHaveClass("dark");
        expect(localStorage.getItem("mui-mode")).toBe("dark");

        await user.click(screen.getByRole("button", {name: "Theme: dark"}));
        expect(document.documentElement).toHaveClass("light");
        expect(localStorage.getItem("mui-mode")).toBe("system");
        expect(screen.getByRole("button", {name: "Theme: system"})).toBeInTheDocument();
    });
});

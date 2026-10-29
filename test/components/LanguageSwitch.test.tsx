import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {LanguageSwitch} from "@/components/LanguageSwitch.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("LanguageSwitch", () => {
    it("marks the current language", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LanguageSwitch/>);

        await user.click(screen.getByRole("button", {name: "Language"}));

        expect(screen.getByRole("menuitemradio", {name: "English", checked: true})).toBeInTheDocument();
        expect(screen.getByRole("menuitemradio", {name: "Polski", checked: false})).toHaveAttribute("lang", "pl");
    });

    it("switches the texts and stores the choice", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LanguageSwitch/>);

        await user.click(screen.getByRole("button", {name: "Language"}));
        await user.click(screen.getByRole("menuitemradio", {name: "Polski"}));

        expect(await screen.findByRole("button", {name: "Język"})).toBeInTheDocument();
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        expect(localStorage.getItem("language")).toBe("pl");
        expect(document.documentElement).toHaveAttribute("lang", "pl");
    });
});

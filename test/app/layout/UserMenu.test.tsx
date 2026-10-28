import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {UserMenu} from "@/app/layout/UserMenu.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";

describe("UserMenu", () => {
    it("is closed at first", () => {
        renderAtRoute(<UserMenu/>);

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Account"})).toHaveAttribute("aria-expanded", "false");
    });

    it.each([
        ["Profile", "/profile"],
        ["Settings", "/settings"],
    ])("opens %s", async (item, pathname) => {
        const user = userEvent.setup();
        renderAtRoute(<UserMenu/>);

        await user.click(screen.getByRole("button", {name: "Account"}));
        await user.click(screen.getByRole("menuitem", {name: item}));

        expect(currentLocation().pathname).toBe(pathname);
    });

    it("closes with Escape", async () => {
        const user = userEvent.setup();
        renderAtRoute(<UserMenu/>);

        const button = screen.getByRole("button", {name: "Account"});
        await user.click(button);
        const menu = screen.getByRole("menu");
        expect(button).toHaveAttribute("aria-expanded", "true");
        await user.keyboard("{Escape}");

        await waitFor(() => expect(menu).not.toBeVisible());
        expect(button).toHaveAttribute("aria-expanded", "false");
    });
});
